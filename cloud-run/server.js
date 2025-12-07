const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);
const app = express();
app.use(express.json());

/**
 * 이미지 URL에서 이미지 다운로드
 */
async function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const tempPath = path.join(os.tmpdir(), `score-${Date.now()}.jpg`);
    const file = fs.createWriteStream(tempPath);

    https.get(imageUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(tempPath);
      });
    }).on('error', (err) => {
      fs.unlink(tempPath, () => {});
      reject(err);
    });
  });
}

/**
 * Audiveris로 MusicXML 생성
 */
async function processWithAudiveris(imagePath) {
  const tempDir = path.join(os.tmpdir(), `audiveris-${Date.now()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });

  try {
    const audiverisJar = '/app/audiveris.jar';
    const command = `java -jar "${audiverisJar}" -batch -input "${imagePath}" -output "${tempDir}"`;

    console.log(`Executing Audiveris: ${command}`);
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });

    if (stderr && !stderr.includes('WARNING') && !stderr.includes('INFO')) {
      console.warn('Audiveris stderr:', stderr);
    }

    // MusicXML 파일 찾기
    const musicXmlFiles = [];
    const findMusicXmlFiles = async (dir) => {
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
      throw new Error('MusicXML file not found in Audiveris output');
    }

    const musicXmlPath = musicXmlFiles[0];
    const musicXmlContent = await fs.promises.readFile(musicXmlPath, 'utf-8');

    return musicXmlContent;
  } finally {
    // 임시 디렉토리 정리
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  }
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'audiveris-cloud-run' });
});

// Audiveris 처리 엔드포인트
app.post('/', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    console.log(`Processing image: ${imageUrl}`);

    // 이미지 다운로드
    const imagePath = await downloadImage(imageUrl);
    console.log(`Downloaded image to: ${imagePath}`);

    try {
      // Audiveris 실행
      const musicXml = await processWithAudiveris(imagePath);
      console.log(`MusicXML generated, length: ${musicXml.length}`);

      res.json({ musicXml });
    } finally {
      // 임시 파일 정리
      try {
        await fs.promises.unlink(imagePath);
      } catch (e) {
        console.warn('Failed to delete temp image:', e);
      }
    }
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Audiveris Cloud Run service listening on port ${PORT}`);
});

