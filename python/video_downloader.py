import yt_dlp
import sys
import json
import os
from pathlib import Path
from io import StringIO

def download_video(url, output_path, quality='720p'):
    """Download video using yt-dlp"""
    try:
        ydl_opts = {
            'format': f'best[height<={quality[:-1]}]/best',
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True,
            'no_color': True,
            'extract_flat': False,
            'noprogress': True,
        }
        
        old_stdout = sys.stdout
        sys.stdout = StringIO()
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                video_data = {
                    'title': info.get('title', 'Unknown'),
                    'duration': info.get('duration_string', 'Unknown'),
                    'uploader': info.get('uploader', 'Unknown'),
                    'view_count': info.get('view_count', 0),
                    'like_count': info.get('like_count', 0),
                }
                
                ydl.download([url])
                
                if os.path.exists(output_path):
                    file_size = os.path.getsize(output_path) / (1024 * 1024) 
                    video_data['file_size'] = file_size
                    
                    if file_size > 25:
                        os.remove(output_path)
                        return {'success': False, 'error': f'File too large: {file_size:.2f}MB (limit: 25MB)'}
                
                return {'success': True, 'data': video_data}
        finally:
            sys.stdout = old_stdout
            
    except Exception as e:
        sys.stdout = old_stdout
        return {'success': False, 'error': str(e)}

def download_audio(url, output_path, quality='128'):
    """Download audio as MP3 using yt-dlp"""
    try:
        ydl_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
            'outtmpl': output_path,
            'quiet': True,
            'no_warnings': True,
            'no_color': True,
            'extract_flat': False,
            'noprogress': True,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': quality,
            }],
        }
        
        old_stdout = sys.stdout
        sys.stdout = StringIO()
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                audio_data = {
                    'title': info.get('title', 'Unknown'),
                    'duration': info.get('duration_string', 'Unknown'),
                    'uploader': info.get('uploader', 'Unknown'),
                    'view_count': info.get('view_count', 0),
                    'like_count': info.get('like_count', 0),
                }
                
                ydl.download([url])
                
                mp3_path = output_path.replace('.%(ext)s', '.mp3')
                if os.path.exists(mp3_path):
                    file_size = os.path.getsize(mp3_path) / (1024 * 1024)  # MB
                    audio_data['file_size'] = file_size
                    audio_data['file_path'] = mp3_path
                    audio_data['format'] = 'MP3'
                    
                    if file_size > 25:
                        os.remove(mp3_path)
                        return {'success': False, 'error': f'File too large: {file_size:.2f}MB (limit: 25MB)'}
                else:
                    return {'success': False, 'error': 'Audio file not found after download'}
                
                return {'success': True, 'data': audio_data}
        finally:
            sys.stdout = old_stdout
            
    except Exception as e:
        sys.stdout = old_stdout
        error_msg = str(e)
        
        if 'ffmpeg' in error_msg.lower() or 'ffprobe' in error_msg.lower() or 'postprocessing' in error_msg.lower():
         
            return download_audio_fallback(url, output_path, quality)
        else:
            return {'success': False, 'error': str(e)}

def download_audio_fallback(url, output_path, quality='128'):
    """Download audio without FFmpeg conversion (fallback method)"""
    try:
        format_options = [
            'bestaudio[ext=m4a][abr<=192]/bestaudio[ext=m4a]',
            'bestaudio[ext=webm][abr<=192]/bestaudio[ext=webm]', 
            'bestaudio[ext=ogg][abr<=192]/bestaudio[ext=ogg]',
            'bestaudio[abr<=192]/bestaudio/best[height=0]'
        ]
        
        for format_selector in format_options:
            try:
                ydl_opts = {
                    'format': format_selector,
                    'outtmpl': output_path,
                    'quiet': True,
                    'no_warnings': True,
                    'no_color': True,
                    'extract_flat': False,
                    'noprogress': True,
                }
                
                old_stdout = sys.stdout
                sys.stdout = StringIO()
                
                try:
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        info = ydl.extract_info(url, download=False)
                        
                        audio_data = {
                            'title': info.get('title', 'Unknown'),
                            'duration': info.get('duration_string', 'Unknown'),
                            'uploader': info.get('uploader', 'Unknown'),
                            'view_count': info.get('view_count', 0),
                            'like_count': info.get('like_count', 0),
                        }
                        
                        ydl.download([url])
                        
                        base_path = output_path.replace('.%(ext)s', '')
                        possible_extensions = ['.m4a', '.webm', '.ogg', '.aac', '.mp3']
                        audio_file = None
                        
                        for ext in possible_extensions:
                            test_path = base_path + ext
                            if os.path.exists(test_path):
                                audio_file = test_path
                                break
                        
                        if audio_file and os.path.exists(audio_file):
                            file_size = os.path.getsize(audio_file) / (1024 * 1024)  # MB
                            audio_data['file_size'] = file_size
                            audio_data['file_path'] = audio_file
                            
                            ext = os.path.splitext(audio_file)[1].upper()
                            audio_data['format'] = f'{ext[1:]} (FFmpeg not available)'
                            
                            if file_size > 25:
                                os.remove(audio_file)
                                return {'success': False, 'error': f'File too large: {file_size:.2f}MB (limit: 25MB)'}
                            
                            return {'success': True, 'data': audio_data}
                finally:
                    sys.stdout = old_stdout
                    
            except Exception as format_error:
                sys.stdout = old_stdout
                continue 
        
        return {'success': False, 'error': 'Không thể tải audio với bất kỳ format nào. Hãy cài đặt FFmpeg để có kết quả tốt hơn.'}
            
    except Exception as e:
        if 'sys.stdout' in locals():
            sys.stdout = old_stdout
        return {'success': False, 'error': f'Lỗi khi tải audio: {str(e)}'}

def search_videos(query, max_results=6):
    """Search for videos"""
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'no_color': True,
            'extract_flat': False,
        }
        
        old_stdout = sys.stdout
        sys.stdout = StringIO()
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                search_results = ydl.extract_info(f"ytsearch{max_results}:{query}", download=False)
                
                videos = []
                for entry in search_results['entries']:
                    videos.append({
                        'title': entry.get('title', 'Unknown'),
                        'url': entry.get('webpage_url', ''),
                        'duration': entry.get('duration_string', 'Unknown'),
                        'uploader': entry.get('uploader', 'Unknown'),
                        'view_count': entry.get('view_count', 0),
                    })
                
                return {'success': True, 'videos': videos}
        finally:
            sys.stdout = old_stdout
            
    except Exception as e:
        sys.stdout = old_stdout
        return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    sys.stderr = open(os.devnull, 'w')
    
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Missing arguments'}), flush=True)
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == "search":
        if len(sys.argv) < 3:
            print(json.dumps({'success': False, 'error': 'Missing search query'}), flush=True)
            sys.exit(1)
        
        query = sys.argv[2]
        result = search_videos(query)
        print(json.dumps(result), flush=True)
        
    elif action == "download":
        if len(sys.argv) < 4:
            print(json.dumps({'success': False, 'error': 'Missing download arguments'}), flush=True)
            sys.exit(1)
        
        url = sys.argv[2]
        output_path = sys.argv[3]
        quality = sys.argv[4] if len(sys.argv) > 4 else '720p'
        
        result = download_video(url, output_path, quality)
        print(json.dumps(result), flush=True)
        
    elif action == "audio":
        if len(sys.argv) < 4:
            print(json.dumps({'success': False, 'error': 'Missing audio download arguments'}), flush=True)
            sys.exit(1)
        
        url = sys.argv[2]
        output_path = sys.argv[3]
        quality = sys.argv[4] if len(sys.argv) > 4 else '128'
        
        result = download_audio(url, output_path, quality)
        print(json.dumps(result), flush=True)
        
    else:
        print(json.dumps({'success': False, 'error': 'Invalid action'}), flush=True)
