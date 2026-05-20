#!/usr/bin/env python3
"""
push_to_hub.py — Push model lên Hugging Face Hub.
Dùng cho cả tài khoản cá nhân và organization.
"""
import os

MODEL_DIR = os.getenv("MODEL_DIR", "./output/uteshop-chatbot")
# Có thể đặt tên org/repo hoặc user/repo
# Ví dụ: "tthanhhau/uteshop-chatbot" hoặc "my-org/uteshop-chatbot"
HF_REPO = os.getenv("HF_REPO", "")
HF_TOKEN = os.getenv("HF_TOKEN", "")

def main():
    if not HF_REPO:
        print("❌ Set HF_REPO env var. Ví dụ:")
        print("   HF_REPO=tthanhhau/uteshop-chatbot python push_to_hub.py")
        print("   HF_REPO=my-org/uteshop-chatbot python push_to_hub.py")
        return
    
    print(f"🚀 Pushing model → https://huggingface.co/{HF_REPO}")
    
    # Login nếu có token
    if HF_TOKEN:
        from huggingface_hub import login
        login(token=HF_TOKEN)
        print("✅ HF Login OK")
    
    from unsloth import FastLanguageModel
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=MODEL_DIR,
        max_seq_length=2048,
        load_in_4bit=True,
    )
    
    # Push LoRA adapter
    print("📤 Pushing LoRA adapter...")
    model.push_to_hub(HF_REPO, token=HF_TOKEN or None)
    tokenizer.push_to_hub(HF_REPO, token=HF_TOKEN or None)
    
    # Push merged model (optional, tốn bandwidth)
    push_merged = os.getenv("PUSH_MERGED", "false").lower() == "true"
    if push_merged:
        merged_repo = HF_REPO + "-merged"
        print(f"📤 Pushing merged model → {merged_repo}")
        model.push_to_hub_merged(merged_repo, tokenizer, 
                                 save_method="merged_16bit", 
                                 token=HF_TOKEN or None)
    
    # Push GGUF (optional)
    push_gguf = os.getenv("PUSH_GGUF", "false").lower() == "true"
    if push_gguf:
        gguf_repo = HF_REPO + "-GGUF"
        print(f"📤 Pushing GGUF → {gguf_repo}")
        model.push_to_hub_gguf(gguf_repo, tokenizer,
                               quantization_method="q4_k_m",
                               token=HF_TOKEN or None)
    
    print(f"\n✅ Done! Model: https://huggingface.co/{HF_REPO}")

if __name__ == "__main__":
    main()
