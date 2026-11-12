import os
import subprocess
from pypdf import PdfReader
import docx

def extract_text_from_pdf(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"

def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        text = "\n".join([p.text for p in doc.paragraphs if p.text])
        return text.strip()
    except Exception as e:
        return f"Error extracting text from DOCX: {str(e)}"

def extract_text_from_txt(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        return f"Error reading text file: {str(e)}"

def extract_audio_from_video(video_path: str, output_audio_path: str) -> bool:
    """Extract audio from video file using ffmpeg"""
    try:
        cmd = [
            "ffmpeg", "-y", "-i", video_path,
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            output_audio_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=300)
        return result.returncode == 0
    except Exception as e:
        print(f"Error extracting audio from video: {e}")
        return False

def transcribe_audio(file_path: str) -> str:
    """Transcribe audio file using faster-whisper"""
    try:
        from faster_whisper import WhisperModel

        # Use base model for balance of speed/accuracy
        model_size = os.getenv("WHISPER_MODEL", "base")

        # Auto-detect device (CPU/GPU)
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"

        model = WhisperModel(model_size, device=device, compute_type=compute_type)

        segments, info = model.transcribe(file_path, beam_size=5)

        transcript = " ".join([segment.text for segment in segments])
        return transcript.strip()

    except ImportError:
        return "[Transcription unavailable: faster-whisper not installed]"
    except Exception as e:
        return f"[Transcription error: {str(e)}]"

def process_file_content(file_path: str, file_type: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    elif ext in [".mp3", ".wav", ".m4a"]:
        # Audio files - transcribe directly
        return transcribe_audio(file_path)
    elif ext in [".mp4", ".mov", ".mkv"]:
        # Video files - extract audio then transcribe
        audio_path = file_path + ".wav"
        if extract_audio_from_video(file_path, audio_path):
            transcript = transcribe_audio(audio_path)
            # Clean up temp audio file
            try:
                os.remove(audio_path)
            except:
                pass
            return transcript
        else:
            return f"[Error: Failed to extract audio from {os.path.basename(file_path)}]"
    else:
        return "Unsupported file format for text extraction."