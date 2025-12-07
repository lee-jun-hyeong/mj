# Eventarc 권한 문제 해결

## 문제
Firebase Functions v2 Storage 트리거 배포 시 다음 오류 발생:
```
Permission "storage.buckets.get" denied on "Bucket \"michael-jesus.firebasestorage.app\""
```

## 원인
Eventarc 서비스 계정이 Storage 버킷에 접근할 수 없음

## 해결 방법

### 방법 1: Firebase Console에서 권한 부여 (권장)

1. https://console.cloud.google.com/iam-admin/iam?project=michael-jesus 접속
2. "Eventarc Service Account" 검색
3. 서비스 계정에 다음 역할 추가:
   - `Storage Object Viewer` (storage.objects.get)
   - `Storage Bucket Reader` (storage.buckets.get)

또는

### 방법 2: gcloud CLI로 권한 부여

```bash
# Eventarc 서비스 계정 이메일 확인
gcloud projects get-iam-policy michael-jesus --flatten="bindings[].members" --filter="bindings.members:*eventarc*"

# 권한 부여
gcloud projects add-iam-policy-binding michael-jesus \
  --member="serviceAccount:service-51418627624@gcp-sa-eventarc.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding michael-jesus \
  --member="serviceAccount:service-51418627624@gcp-sa-eventarc.iam.gserviceaccount.com" \
  --role="roles/storage.legacyBucketReader"
```

### 방법 3: Storage 버킷에 직접 권한 부여

```bash
gsutil iam ch serviceAccount:service-51418627624@gcp-sa-eventarc.iam.gserviceaccount.com:objectViewer gs://michael-jesus.firebasestorage.app
```

## 배포 재시도

권한 부여 후 다시 배포:

```bash
firebase deploy --only functions
```

