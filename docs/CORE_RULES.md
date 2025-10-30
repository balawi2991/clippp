# 🎯 القوانين الأساسية - لا تتجاوزها!

## 🔴 القاعدة الذهبية:

**الصوت يحدد طول الفيديو دائماً - ليس العكس!**

---

## 📋 القوانين الأساسية:

### 1. المشغل (Player)
```javascript
// ✅ الصحيح:
useEffect(() => {
  // event listeners
}, [videoUrl]); // يُنفّذ عند تغيير videoUrl

// ❌ الخطأ:
useEffect(() => {
  // event listeners
}, []); // لا يُنفّذ عند Navigation!
```

**القاعدة:** Event listeners يجب أن تُعاد عند تغيير videoUrl

---

### 2. التوليد (Generation)
```
1. Generate audio (TTS)
2. Get actual audio duration
3. Adjust video duration to match audio
4. Generate captions based on actual duration
```

**القاعدة:** الفيديو = الصوت (دائماً متطابقان)

---

### 3. التصدير (Export)
```
1. Use existing preview/base_video.mp4
2. Burn captions only
3. Save to exports/final.mp4
4. DON'T recreate video from scratch!
```

**القاعدة:** Export يستخدم preview الموجود (لا يُعيد الإنشاء)

---

### 4. الملفات
```
preview/base_video.mp4  → للمشغل (بدون حرق)
exports/final.mp4       → للتحميل (مع حرق)
```

**القاعدة:** المشغل يعرض preview دائماً (ليس exports)

---

### 5. FFmpeg
```javascript
// ❌ لا تستخدم:
-shortest // يقطع الفيديو!

// ✅ استخدم:
// دع الصوت يحدد المدة
```

**القاعدة:** لا -shortest flag أبداً

---

## 🎬 كيف يعمل النظام:

### التوليد (Generate):
```
1. User يكتب نص
2. Split إلى مشاهد (6-10s لكل مشهد)
3. Generate TTS لكل مشهد
4. Concatenate audio
5. Adjust video duration = audio duration
6. Fetch images (1 لكل مشهد)
7. Create video from images
8. Add audio
9. Generate captions
10. Save to preview/base_video.mp4
```

### المشغل (Player):
```
1. Load preview/base_video.mp4
2. Setup event listeners (عند تغيير videoUrl)
3. Show caption overlay (ديناميكي)
4. User يُعدّل الكابشن
5. Changes تُحفظ في DB
```

### التصدير (Export):
```
1. Render captions to PNG overlays
2. Load preview/base_video.mp4
3. Burn captions using FFmpeg
4. Save to exports/final.mp4
5. User يُحمّل الفيديو
```

---

## ⚠️ أخطاء شائعة:

### ❌ لا تفعل:
1. useEffect مع [] للـ event listeners
2. إعادة إنشاء الفيديو في Export
3. استخدام -shortest flag
4. تجاهل audio duration الفعلي
5. حساب captions قبل معرفة audio duration

### ✅ افعل:
1. useEffect مع [videoUrl]
2. استخدام preview في Export
3. مطابقة video = audio دائماً
4. حساب captions بعد audio
5. Cleanup في return

---

## 🎯 الأولويات الحالية:

### عاجل:
1. إصلاح Audio/Video duration mismatch
2. إصلاح Caption timing
3. تفعيل Music

### قريباً:
4. إضافة Watermark
5. توضيح Target Length

---

## 📊 الحالة:

**النظام:** 7.4/10
- ✅ مستقر
- ⚠️ بعض مشاكل التوقيت
- ❌ بعض الميزات غير مُفعّلة

**الهدف:** 9/10 بعد الإصلاحات
