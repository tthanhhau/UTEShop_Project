#!/usr/bin/env python3
"""
train_unsloth.py — Fine-tune Qwen2.5-7B-Instruct cho UTEShop chatbot.
Sử dụng Unsloth + QLoRA 4bit trên Google Colab T4 GPU.

Chạy trên Colab hoặc local có GPU:
  pip install unsloth transformers trl datasets peft accelerate bitsandbytes
  python train_unsloth.py
"""
import os, json, torch
from datasets import load_dataset

# ===================== CONFIG =====================
MODEL_NAME = "unsloth/Qwen2.5-7B-Instruct-bnb-4bit"  # 4bit pre-quantized
DATASET_FILE = os.getenv("DATASET_FILE", "./dataset/dataset_uteshop.jsonl")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./output/uteshop-chatbot")
HF_REPO = os.getenv("HF_REPO", "")  # e.g., "tthanhhau/uteshop-chatbot"

# Hyperparameters (optimized for T4 16GB)
MAX_SEQ_LENGTH = 2048
BATCH_SIZE = 2
GRAD_ACCUM = 4
LR = 2e-4
EPOCHS = 3
LORA_R = 16
LORA_ALPHA = 32
LORA_DROPOUT = 0.05

# Prompt template (Alpaca format cho Qwen)
PROMPT_TEMPLATE = """### Instruction:
{instruction}

### Input:
{input}

### Response:
{output}"""


def format_dataset(example):
    """Format mỗi record thành prompt string."""
    text = PROMPT_TEMPLATE.format(
        instruction=example["instruction"],
        input=example["input"],
        output=example["output"]
    )
    return {"text": text}


def main():
    print("🚀 UTEShop Fine-Tuning Pipeline")
    print("=" * 50)
    
    # ===== 1. Load Model =====
    print("\n📥 Loading model...")
    from unsloth import FastLanguageModel
    
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=MODEL_NAME,
        max_seq_length=MAX_SEQ_LENGTH,
        load_in_4bit=True,
        dtype=None,  # auto detect
    )
    print(f"✅ Model loaded: {MODEL_NAME}")
    
    # ===== 2. Setup LoRA =====
    print("\n🔧 Setting up LoRA...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=LORA_R,
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"],
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )
    model.print_trainable_parameters()
    
    # ===== 3. Load Dataset =====
    print(f"\n📂 Loading dataset: {DATASET_FILE}")
    dataset = load_dataset("json", data_files=DATASET_FILE, split="train")
    dataset = dataset.map(format_dataset, remove_columns=dataset.column_names)
    print(f"✅ Dataset: {len(dataset)} records")
    
    # Preview
    print(f"\n📝 Sample:\n{dataset[0]['text'][:300]}...")
    
    # ===== 4. Tokenize =====
    def tokenize(example):
        return tokenizer(
            example["text"],
            truncation=True,
            max_length=MAX_SEQ_LENGTH,
            padding="max_length",
        )
    
    tokenized = dataset.map(tokenize, batched=True, remove_columns=["text"])
    
    # ===== 5. Training =====
    print("\n🏋️ Starting training...")
    from trl import SFTTrainer
    from transformers import TrainingArguments
    
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=MAX_SEQ_LENGTH,
        args=TrainingArguments(
            output_dir=OUTPUT_DIR,
            per_device_train_batch_size=BATCH_SIZE,
            gradient_accumulation_steps=GRAD_ACCUM,
            learning_rate=LR,
            num_train_epochs=EPOCHS,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            logging_steps=10,
            save_steps=100,
            save_total_limit=2,
            warmup_ratio=0.1,
            weight_decay=0.01,
            optim="adamw_8bit",
            seed=42,
            report_to="none",
        ),
    )
    
    # Train
    stats = trainer.train()
    print(f"\n✅ Training complete!")
    print(f"   Loss: {stats.training_loss:.4f}")
    print(f"   Steps: {stats.global_step}")
    
    # ===== 6. Save =====
    print(f"\n💾 Saving model → {OUTPUT_DIR}")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    
    # Save merged model
    merged_dir = OUTPUT_DIR + "-merged"
    print(f"💾 Saving merged model → {merged_dir}")
    model.save_pretrained_merged(merged_dir, tokenizer, save_method="merged_16bit")
    
    # ===== 7. Push to HF (optional) =====
    if HF_REPO:
        print(f"\n🚀 Pushing to HuggingFace: {HF_REPO}")
        model.push_to_hub(HF_REPO)
        tokenizer.push_to_hub(HF_REPO)
        print(f"✅ Pushed: https://huggingface.co/{HF_REPO}")
    else:
        print("\n⏭️ Skipping HF push (set HF_REPO env var)")
    
    print("\n🎉 Done! Next: export GGUF with export_gguf.py")


if __name__ == "__main__":
    main()
