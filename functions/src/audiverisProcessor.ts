import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * Audiveris를 사용하여 악보 이미지를 MusicXML로 변환
 */
export async function processWithAudiveris(
  imagePath: string,
  outputDir: string
): Promise<string> {
  // Audiveris 실행
  // Audiveris는 Java 기반이므로 java 명령어로 실행
  // 예: java -jar audiveris.jar -batch -export -output <outputDir> <imagePath>

  // 임시 디렉토리 생성
  const tempDir = path.join(os.tmpdir(), `audiveris-${Date.now()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });

  try {
    // Java 설치 확인
    try {
      await execAsync('java -version');
    } catch (error) {
      throw new Error('Java is not installed or not in PATH. Audiveris requires Java.');
    }

    // Audiveris JAR 파일 경로 (환경 변수 또는 기본 경로)
    const audiverisJar = process.env.AUDIVERIS_JAR_PATH || path.join(__dirname, '../audiveris.jar');

    // JAR 파일 존재 확인
    if (!fs.existsSync(audiverisJar)) {
      throw new Error(`Audiveris JAR file not found at: ${audiverisJar}. Please set AUDIVERIS_JAR_PATH environment variable.`);
    }

    // Audiveris 명령어 실행
    // 형식: java -jar audiveris.jar -batch -input <image> -output <output_dir>
    // 또는: java -cp audiveris.jar org.audiveris.omr.Main -batch -input <image> -output <output_dir>
    const command = `java -jar "${audiverisJar}" -batch -input "${imagePath}" -output "${tempDir}"`;

    console.log(`Executing Audiveris: ${command}`);

    // 타임아웃 설정 (5분)
    const timeout = 5 * 60 * 1000;
    const { stdout, stderr } = await Promise.race([
      execAsync(command, { maxBuffer: 10 * 1024 * 1024 }), // 10MB 버퍼
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Audiveris execution timeout')), timeout)
      )
    ]) as { stdout: string; stderr: string };

    if (stderr && !stderr.includes('WARNING') && !stderr.includes('INFO')) {
      console.warn('Audiveris stderr:', stderr);
    }

    console.log('Audiveris stdout:', stdout);

    // 생성된 MusicXML 파일 찾기 (재귀적으로 검색)
    const musicXmlFiles: string[] = [];

    const findMusicXmlFiles = async (dir: string): Promise<void> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await findMusicXmlFiles(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.musicxml') || entry.name.endsWith('.xml'))) {
          musicXmlFiles.push(fullPath);
        }
      }
    };

    await findMusicXmlFiles(tempDir);

    if (musicXmlFiles.length === 0) {
      // 디버깅: 출력 디렉토리 구조 확인
      console.log('Output directory structure:');
      const logDir = async (dir: string, indent: string = '') => {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          console.log(`${indent}${entry.name}${entry.isDirectory() ? '/' : ''}`);
          if (entry.isDirectory()) {
            await logDir(path.join(dir, entry.name), indent + '  ');
          }
        }
      };
      await logDir(tempDir);

      throw new Error('MusicXML file not found in Audiveris output directory');
    }

    // 첫 번째 MusicXML 파일 사용 (일반적으로 하나만 생성됨)
    const musicXmlPath = musicXmlFiles[0];
    console.log(`Found MusicXML file: ${musicXmlPath}`);

    const musicXmlContent = await fs.promises.readFile(musicXmlPath, 'utf-8');

    return musicXmlContent;
  } catch (error) {
    console.error('Audiveris processing error:', error);
    throw error;
  } finally {
    // 임시 디렉토리 정리
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  }
}

/**
 * 이미지 URL에서 이미지를 다운로드하여 로컬 파일로 저장
 */
export async function downloadImageToTemp(imageUrl: string): Promise<string> {
  const https = require('https');
  const http = require('http');
  const url = require('url');

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(imageUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const tempPath = path.join(os.tmpdir(), `score-${Date.now()}.jpg`);

    const file = fs.createWriteStream(tempPath);

    protocol.get(imageUrl, (response: any) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(tempPath);
      });
    }).on('error', (err: Error) => {
      fs.unlink(tempPath, () => {});
      reject(err);
    });
  });
}

