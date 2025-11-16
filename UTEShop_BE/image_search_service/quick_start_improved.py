#!/usr/bin/env python3
"""
Quick Start Script for Improved Image Search Service
"""

import subprocess
import sys
import os

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        return False
    print(f"✅ Python {sys.version.split()[0]} detected")
    return True

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def test_imports():
    """Test if all required modules can be imported"""
    print("🧪 Testing imports...")
    try:
        import flask
        import cv2
        import sklearn
        import PIL
        import numpy
        import pymongo
        import requests
        import sentence_transformers
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def start_service():
    """Start the image search service"""
    print("🚀 Starting Improved Image Search Service...")
    print("📍 Service will be available at: http://localhost:5002")
    print("🔍 Health check: http://localhost:5002/health")
    print("📊 Search endpoint: http://localhost:5002/search")
    print("\n" + "="*50)
    print("🎯 IMPROVEMENTS ACTIVATED:")
    print("✅ Color Detection & Matching")
    print("✅ Multi-Factor Scoring")
    print("✅ Similarity Thresholds")
    print("✅ Enhanced Logging")
    print("="*50 + "\n")
    
    try:
        subprocess.call([sys.executable, "app.py"])
    except KeyboardInterrupt:
        print("\n👋 Service stopped by user")
    except Exception as e:
        print(f"❌ Failed to start service: {e}")

def main():
    """Main setup process"""
    print("🎨 Improved Image Search Service - Quick Start")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return
    
    # Install dependencies
    if not install_dependencies():
        return
    
    # Test imports
    if not test_imports():
        return
    
    # Ask user if they want to start the service
    response = input("\n🚀 Do you want to start the service now? (y/n): ").lower().strip()
    if response in ['y', 'yes', '']:
        start_service()
    else:
        print("✅ Setup completed. Run 'python app.py' to start the service later.")

if __name__ == "__main__":
    main()