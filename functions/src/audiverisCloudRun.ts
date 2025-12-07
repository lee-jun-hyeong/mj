import * as https from 'https';

/**
 * Cloud Run 서비스를 통해 Audiveris 실행
 */
export async function processWithAudiverisCloudRun(
  imageUrl: string,
  cloudRunUrl: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(cloudRunUrl);
    const postData = JSON.stringify({ imageUrl });

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            resolve(result.musicXml);
          } catch (error) {
            reject(new Error(`Failed to parse Cloud Run response: ${error}`));
          }
        } else {
          reject(new Error(`Cloud Run error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Cloud Run request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

