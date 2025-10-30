# 🎙️ Groq TTS - الأصوات المتاحة

## 🇬🇧 English Voices (playai-tts)

| Voice Name | Description | Best For |
|------------|-------------|----------|
| **Fritz-PlayAI** | صوت ذكوري واضح ومحترف | محتوى تعليمي، أخبار |
| **Arista-PlayAI** | صوت أنثوي ناعم | إعلانات، محتوى ترفيهي |
| **Atlas-PlayAI** | صوت ذكوري قوي | محتوى تحفيزي |
| **Basil-PlayAI** | صوت ذكوري دافئ | قصص، روايات |
| **Briggs-PlayAI** | صوت ذكوري عميق | محتوى احترافي |
| **Calum-PlayAI** | صوت ذكوري شاب | محتوى شبابي |
| **Celeste-PlayAI** | صوت أنثوي راقي | محتوى فاخر |
| **Cheyenne-PlayAI** | صوت أنثوي حيوي | محتوى نشيط |
| **Chip-PlayAI** | صوت ذكوري ودود | محتوى عائلي |
| **Cillian-PlayAI** | صوت ذكوري أنيق | محتوى فني |
| **Deedee-PlayAI** | صوت أنثوي مرح | محتوى ترفيهي |
| **Gail-PlayAI** | صوت أنثوي محترف | محتوى تجاري |
| **Indigo-PlayAI** | صوت محايد | محتوى تقني |
| **Mamaw-PlayAI** | صوت أنثوي دافئ | قصص عائلية |
| **Mason-PlayAI** | صوت ذكوري قوي | محتوى رياضي |
| **Mikail-PlayAI** | صوت ذكوري واضح | محتوى تعليمي |
| **Mitch-PlayAI** | صوت ذكوري ودود | محتوى يومي |
| **Quinn-PlayAI** | صوت محايد | محتوى عام |
| **Thunder-PlayAI** | صوت ذكوري قوي جداً | محتوى درامي |

## 🇸🇦 Arabic Voices (playai-tts-arabic)

| Voice Name | Description |
|------------|-------------|
| **Voice 1** | صوت عربي 1 |
| **Voice 2** | صوت عربي 2 |
| **Voice 3** | صوت عربي 3 |
| **Voice 4** | صوت عربي 4 |

*ملاحظة: الأصوات العربية متاحة لكن لم يتم توثيق أسمائها بعد في Groq Docs*

---

## ⚙️ كيفية التغيير

### في ملف `.env`:
```env
TTS_MODEL=playai-tts
TTS_VOICE=Fritz-PlayAI
```

### للغة العربية:
```env
TTS_MODEL=playai-tts-arabic
TTS_VOICE=Voice1  # أو Voice2, Voice3, Voice4
```

---

## 🎯 التوصيات حسب نوع المحتوى

### 📚 محتوى تعليمي
- **Fritz-PlayAI** - واضح ومحترف
- **Mikail-PlayAI** - صوت تعليمي ممتاز

### 💪 محتوى تحفيزي
- **Atlas-PlayAI** - قوي ومحفز
- **Thunder-PlayAI** - درامي وقوي جداً

### 🎬 محتوى ترفيهي
- **Arista-PlayAI** - أنثوي ناعم
- **Deedee-PlayAI** - مرح وحيوي

### 💼 محتوى احترافي
- **Briggs-PlayAI** - عميق واحترافي
- **Gail-PlayAI** - أنثوي محترف

### 👨‍👩‍👧‍👦 محتوى عائلي
- **Chip-PlayAI** - ودود وعائلي
- **Mamaw-PlayAI** - دافئ وحنون

---

## 📊 المواصفات التقنية

- **Max Input:** 10,000 حرف لكل طلب
- **Output Format:** WAV (يتم تحويله لـ MP3 تلقائياً)
- **Sample Rate:** 16KHz (optimal for speech)
- **Bitrate:** 192kbps (بعد التحويل لـ MP3)
- **Latency:** سريع جداً (~1-2 ثانية لكل 100 كلمة)

---

## 💰 التكلفة

حسب [Groq Pricing](https://console.groq.com/settings/billing):
- **Free Tier:** محدود
- **Dev Tier:** حسب الاستخدام

*تحقق من console.groq.com للتفاصيل الدقيقة*

---

## 🔗 روابط مفيدة

- [Groq TTS Docs](https://console.groq.com/docs/text-to-speech)
- [Groq Console](https://console.groq.com/)
- [API Keys](https://console.groq.com/keys)
- [Pricing](https://console.groq.com/settings/billing)
