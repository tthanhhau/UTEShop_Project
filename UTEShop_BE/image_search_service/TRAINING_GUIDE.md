# UTEShop CLIP Fine-tuning

## 1. Dua len Google Colab bang Google Drive (huong dan chi tiet)

Colab nen chay qua Google Drive. Khong can import truc tiep ca project vao Colab.

### 1.1. Chuan bi file nen tren may

Trong thu muc `UTEShop_BE`, nen rieng thu muc `image_search_service` thanh zip.

Nen co cac file/thu muc sau trong zip:

```text
image_search_service/
  train_clip.py
  download_training_images.py
  requirements-training.txt
  requirements.txt
  training_data/
    train.json
    train.jsonl
    train_meta.json
```

Khong bat buoc nen `training_data/images/` vi Colab co the tai lai anh bang `download_training_images.py`.

Dat file nen vao Google Drive, co the la `.zip` hoac `.7z`, vi du:

```text
MyDrive/uteshop_clip/image_search_service.zip
MyDrive/uteshop_clip/image_search_service.7z
```

### 1.2. Mount Google Drive trong Colab

Tao notebook Colab moi, bat GPU:

```text
Runtime -> Change runtime type -> T4 GPU
```

Chay cell nay:

```python
from google.colab import drive
drive.mount('/content/drive')
```

### 1.3. Giai nen project train tu Drive

Neu file cua ban la `.zip`, chay:

```python
!mkdir -p /content/uteshop_clip
!unzip -o "/content/drive/MyDrive/uteshop_clip/image_search_service.zip" -d /content/uteshop_clip
%cd /content/uteshop_clip/image_search_service
```

Neu file cua ban la `.7z`, chay:

```python
!apt-get update -qq
!apt-get install -y p7zip-full
!mkdir -p /content/uteshop_clip
!7z x "/content/drive/MyDrive/uteshop_clip/image_search_service.7z" -o/content/uteshop_clip -y
%cd /content/uteshop_clip/image_search_service
```

Luu y: lenh `7z` viet `-o/content/uteshop_clip`, khong co dau cach sau `-o`.

Neu giai nen xong file nam truc tiep trong `/content/uteshop_clip` thay vi co thu muc `image_search_service`, doi cell `%cd` thanh:

```python
%cd /content/uteshop_clip
```

Kiem tra file:

```python
!ls
!ls training_data
```

### 1.4. Cai thu vien

```python
!pip install -r requirements-training.txt
```

Neu Colab yeu cau restart runtime sau khi cai thu vien, restart roi chay lai cell mount Drive va `%cd`.

### 1.5. (Quan trong) Bo ban cu va tai lai anh de convert sang JPG

Neu truoc do da tai anh, nen xoa thu muc cu de tranh lẫn file .avif/.heic:

```python
!rm -rf training_data/images
```

Sau do tai lai anh (script da tu dong convert sang JPG):

```python
!python download_training_images.py
```

Kiem tra nhanh:

```python
!find training_data/images -type f | wc -l
!find training_data/images -type f | head -n 5
```

Neu trong zip chua co `training_data/images/`, chay:

```python
!python download_training_images.py
```

### 1.6. (Tuy chon) Loc file train de bo qua anh .avif/.heic

Neu bi loi doc anh do dinh dang `.avif` hoac `.heic`, co the loc ra file JSONL moi:

```python
%%bash
python - <<'PY'
import json
from pathlib import Path

data = Path("training_data/train.jsonl")
out = Path("training_data/train.filtered.jsonl")
bad_ext = {".avif", ".heic"}

with data.open("r", encoding="utf-8") as f, out.open("w", encoding="utf-8") as w:
  for line in f:
    rec = json.loads(line)
    if Path(rec["image"]).suffix.lower() in bad_ext:
      continue
    w.write(line)

print("done", out)
PY
```

Kiem tra:

```python
!ls -lh training_data/train.filtered.jsonl
!wc -l training_data/train.filtered.jsonl
```

### 1.7. Train model (bo model cu neu muon train lai tu dau)

Neu muon train lai hoan toan, xoa model cu truoc:

```python
!rm -rf models/uteshop-clip
```

Train mac dinh:

```python
!python train_clip.py
```

Neu dung file loc, set `TRAIN_DATA_PATH`:

```python
%env TRAIN_DATA_PATH=training_data/train.filtered.jsonl
!python -u train_clip.py
```

Neu bi loi het VRAM, giam batch size va epoch:

```python
%env TRAIN_BATCH_SIZE=2
%env TRAIN_EPOCHS=3
!python train_clip.py
```

Neu muon test nhanh, gioi han so mau train:

```python
%env MAX_TRAIN_RECORDS=200
!python -u train_clip.py
```

Model sau train nam o:

```text
models/uteshop-clip
```

### 1.8. Nen model va luu ve Google Drive

Nen zip model va copy ve Drive:

```python
!zip -r uteshop-clip.zip models/uteshop-clip
!mkdir -p "/content/drive/MyDrive/uteshop_clip/output"
!cp uteshop-clip.zip "/content/drive/MyDrive/uteshop_clip/output/uteshop-clip.zip"
```

Sau do mo Google Drive va tai file:

```text
MyDrive/uteshop_clip/output/uteshop-clip.zip
```

### 1.9. Push model len Hugging Face Hub ngay tren Colab

Neu muon day model len Hugging Face Hub truc tiep tu Colab:

```python
!hf auth login
```

Nhap token Hugging Face co quyen write, roi chay:

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("models/uteshop-clip")
model.push_to_hub("your-username/uteshop-clip")
```

## 4. Push model len Hugging Face Hub

Dang nhap:

```bash
hf auth login
```

Push:

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("models/uteshop-clip")
model.push_to_hub("your-username/uteshop-clip")
```

Sau do set bien moi truong cho service:

```text
CLIP_MODEL_NAME=your-username/uteshop-clip
```

Neu de model trong repo local:

```text
CLIP_MODEL_NAME=models/uteshop-clip
```

## 5. Tao lai embedding san pham

Sau khi service load model moi, goi lai:

```text
POST /update-embeddings
```

Embedding cu duoc tao bang model goc, nen bat buoc tao lai sau fine-tune.
