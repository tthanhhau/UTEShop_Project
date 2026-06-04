#!/usr/bin/env python3
"""
export_gguf.py — Export model đã fine-tune sang GGUF cho Ollama.
"""
import os

MODEL_DIR = os.getenv("MODEL_DIR", "./output/uteshop-chatbot")
GGUF_DIR = os.getenv("GGUF_DIR", "./output/gguf")
QUANT = os.getenv("QUANT", "q4_k_m")  # q4_k_m, q5_k_m, q8_0, f16

def main():
    print(f"🔄 Exporting GGUF ({QUANT}) from {MODEL_DIR}")
    
    from unsloth import FastLanguageModel
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=MODEL_DIR,
        max_seq_length=2048,
        load_in_4bit=True,
    )
    
    os.makedirs(GGUF_DIR, exist_ok=True)
    
    print(f"💾 Saving GGUF → {GGUF_DIR}")
    model.save_pretrained_gguf(
        GGUF_DIR,
        tokenizer,
        quantization_method=QUANT,
    )
    
    # List output files
    for f in os.listdir(GGUF_DIR):
        size = os.path.getsize(os.path.join(GGUF_DIR, f)) / (1024**3)
        print(f"   📄 {f} ({size:.2f} GB)")
    
    print(f"\n✅ GGUF exported! Copy .gguf file to Ollama directory.")
    print(f"   ollama create uteshop-ai -f Modelfile")

if __name__ == "__main__":
    main()
