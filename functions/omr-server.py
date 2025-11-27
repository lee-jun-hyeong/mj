#!/usr/bin/env python3
"""
Audiveris OMR 서버
Cloud Run에서 실행되는 간단한 HTTP 서버
실제 Audiveris 통합 시 이 파일을 수정하여 Audiveris를 호출
"""

import os
import json
import base64
import tempfile
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class OMRHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        """이미지 URL을 받아서 MusicXML 반환"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode('utf-8'))
            image_url = data.get('imageUrl')

            if not image_url:
                self.send_error(400, "imageUrl is required")
                return

            # TODO: 실제 Audiveris 호출
            # 현재는 플레이스홀더 MusicXML 반환
            music_xml = self.process_omr(image_url)

            response = {
                'musicXml': music_xml,
                'status': 'success'
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))

        except Exception as e:
            self.send_error(500, str(e))

    def process_omr(self, image_url):
        """OMR 처리 (Audiveris 사용)"""
        import subprocess
        import urllib.request
        import shutil
        
        temp_image = None
        output_dir = None
        
        try:
            # 이미지 다운로드
            print(f'이미지 다운로드 시작: {image_url}')
            temp_image = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            urllib.request.urlretrieve(image_url, temp_image.name)
            print(f'이미지 다운로드 완료: {temp_image.name}')
            
            # 출력 디렉토리 생성
            output_dir = tempfile.mkdtemp()
            print(f'출력 디렉토리 생성: {output_dir}')
            
            # Audiveris 실행
            audiveris_jar = '/app/audiveris.jar'
            if not os.path.exists(audiveris_jar):
                print(f'Audiveris JAR 파일을 찾을 수 없습니다: {audiveris_jar}')
                return self.get_fallback_musicxml()
            
            print('Audiveris 실행 시작...')
            cmd = [
                'java', '-jar', audiveris_jar,
                '-batch',
                '-export',
                '-output', output_dir,
                temp_image.name
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5분 타임아웃
                cwd='/app'
            )
            
            print(f'Audiveris 실행 완료. 반환 코드: {result.returncode}')
            if result.stdout:
                print(f'표준 출력: {result.stdout[:500]}')
            if result.stderr:
                print(f'오류 출력: {result.stderr[:500]}')
            
            if result.returncode != 0:
                print(f'Audiveris 실행 실패: {result.stderr}')
                return self.get_fallback_musicxml()
            
            # 생성된 MusicXML 파일 찾기
            musicxml_files = []
            for root, dirs, files in os.walk(output_dir):
                for file in files:
                    if file.endswith('.musicxml') or file.endswith('.xml'):
                        musicxml_files.append(os.path.join(root, file))
            
            print(f'찾은 MusicXML 파일: {musicxml_files}')
            
            if not musicxml_files:
                print('MusicXML 파일을 찾을 수 없습니다')
                return self.get_fallback_musicxml()
            
            # 첫 번째 MusicXML 파일 읽기
            musicxml_path = musicxml_files[0]
            print(f'MusicXML 파일 읽기: {musicxml_path}')
            with open(musicxml_path, 'r', encoding='utf-8') as f:
                music_xml = f.read()
            
            print(f'MusicXML 읽기 완료, 길이: {len(music_xml)}')
            return music_xml
            
        except subprocess.TimeoutExpired:
            print('Audiveris 실행 타임아웃')
            return self.get_fallback_musicxml()
        except Exception as e:
            print(f'OMR 처리 오류: {e}')
            import traceback
            traceback.print_exc()
            return self.get_fallback_musicxml()
        finally:
            # 임시 파일 정리
            if temp_image and os.path.exists(temp_image.name):
                try:
                    os.unlink(temp_image.name)
                except:
                    pass
            if output_dir and os.path.exists(output_dir):
                try:
                    shutil.rmtree(output_dir)
                except:
                    pass
    
    def get_fallback_musicxml(self):
        """폴백 MusicXML 반환"""
        return '''<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>'''

    def do_GET(self):
        """Health check"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'ok'}).encode('utf-8'))

    def log_message(self, format, *args):
        """로깅 비활성화 (선택사항)"""
        pass

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    server = HTTPServer(('', port), OMRHandler)
    print(f'OMR 서버 시작: 포트 {port}')
    server.serve_forever()

