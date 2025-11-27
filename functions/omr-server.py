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
        """OMR 처리 (플레이스홀더)"""
        # TODO: 실제 Audiveris 실행
        # 예: java -jar audiveris.jar -batch -export -output /tmp /tmp/image.jpg

        # 현재는 기본 MusicXML 반환
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

