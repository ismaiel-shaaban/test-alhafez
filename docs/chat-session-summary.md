# ملخص جلسة التطوير (Chat session summary)

هذا الملف يلخّص التعديلات التي تمت خلال المحادثة: الملفات، الحقول، نقاط النهاية (endpoints)، وأشكال الاستجابة المتوقعة حيث وُجدت في الكود أو في مواصفات الـ API.

---

## 1. تقييمات الطلاب في صفحة الشكاوى (`app/admin/complaints/page.tsx`)

**الهدف:** عرض بيانات الطالب والمعلم في تبويب «تقييمات الطلاب»، وتحسين شكل البطاقات، ثم ضبط التوازن بين الجمال والحجم.

**ملفات مرتبطة:**

| الملف | التعديل |
|--------|---------|
| `lib/api/session-evaluations.ts` | أنواع TypeScript للقائمة، حقول `student` / `teacher`، حقول التقييم الشهري، إلخ. |
| `app/admin/complaints/page.tsx` | واجهة بطاقات التقييم، فلاتر، ربط بـ `useAdminStore` للطلاب/المعلمين عند الحاجة. |

**Endpoint (قائمة التقييمات):**

| | |
|--|--|
| **طلب الكود** | `GET` عبر `getSessionEvaluations` |
| **مسار الـ client** | `/api/session-evaluations` |
| **بعد تحويل `apiRequest`** | `GET {API_BASE_URL}/api/dashboard/session-evaluations` |
| **معاملات الاستعلام (Query keys)** | `student_id`, `satisfaction_level`, `date_from`, `date_to`, `per_page`, `page` |

**شكل الاستجابة (بعد فك غلاف `data` في `apiRequest`):**

```ts
{
  evaluations: SessionEvaluation[],
  pagination: Pagination  // total, per_page, current_page, total_pages
}
```

**مفاتيح مهمة في `SessionEvaluation` (حسب `lib/api/session-evaluations.ts`):**

- `id`, `session_id`, `student_subscription_id?`, `student_id`, `teacher_id?`
- `student?`: `{ id, name, phone? }`
- `teacher?`: `{ id, name, phone? }`
- `is_monthly_subscription_evaluation?`, `evaluation_year?`, `evaluation_month?`, `evaluation_period?`
- تسميات الحقول: `*_label`, نصوص: `academy_advantages`, `notes`, `would_recommend_label`, …
- `created_at`

**ملاحظة:** الـ API قد يعيد حقولاً إضافية؛ النوع يغطي ما يستخدمه الـ admin.

---

## 2. طلبات تغيير المواعيد — فلاتر معلم وطالب (`app/admin/schedule-change-requests/page.tsx`)

**الهدف:** إرسال `teacher_id` و `student_id` مع الطلب كما في صفحات أخرى، وواجهة اختيار معلم/طالب قابلة للبحث.

| الملف | التعديل |
|--------|---------|
| `app/admin/schedule-change-requests/page.tsx` | `SearchableTeacherSelect`, `SearchableStudentSelect`, `useAdminStore`, `useEffect` لتحميل القوائم، اعتماد `filters.teacher_id` و `filters.student_id` في إعادة الجلب. |
| `lib/api/schedule-change-requests.ts` | كان يدعم الفلاتر مسبقاً — لم يُلزم تغيير المنطق. |

**Endpoint:**

| | |
|--|--|
| **طلب الكود** | `getScheduleChangeRequests` |
| **مسار الـ client** | `/api/schedule-change-requests?...` |
| **بعد التحويل** | `GET {API_BASE_URL}/api/dashboard/schedule-change-requests?...` |

**معاملات الاستعلام (Query keys):**

- `page`, `per_page`
- `status` — `pending` \| `approved` \| `rejected`
- `teacher_id` (رقم)
- `student_id` (رقم)

**مثال:**  
`/api/dashboard/schedule-change-requests?per_page=15&page=1&status=pending&teacher_id=94&student_id=1359`

**شكل الاستجابة (بعد `data`):**

```ts
{
  requests: ScheduleChangeRequest[],
  pagination: Pagination
}
```

**مفاتيح أساسية في `ScheduleChangeRequest`:**  
`id`, `teacher_id`, `student_id`, `old_schedule`, `new_schedule`, `status`, `rejection_reason?`, `teacher?`, `student?`, `created_at`, …

---

## 3. سجل عمليات الطالب (Audit logs)

### 3.1 واجهة الـ API (`lib/api/students.ts`)

| | |
|--|--|
| **الدالة** | `getStudentAuditLogs(studentId, options?)` حيث `options`: `{ page?, per_page?, locale? }` |
| **مسار الـ client** | `GET /api/students/{studentId}/audit-logs` (+ `?page=&per_page=` عند الحاجة) |
| **بعد تحويل `apiRequest`** | `GET {API_BASE_URL}/api/dashboard/students/{studentId}/audit-logs` |

**غلاف الاستجابة من الخادم (شائع):**

```json
{
  "status": true,
  "message": "…",
  "data": { … }
}
```

**ما يصل إلى التطبيق بعد `apiRequest` (حقل `data` فقط):**

```ts
interface StudentAuditLogsData {
  student: { id: number; name: string; phone?: string | null }
  logs: StudentAuditLog[]
  pagination?: Pagination  // total, per_page, current_page, total_pages
}
```

**مفاتيح `StudentAuditLog` (الحقول الجديدة مكمّلة للقديمة):**

| المفتاح | الوصف |
|---------|--------|
| `id` | رقم السجل |
| `created_at` | وقت الإنشاء (ISO) |
| `path` | مسار الطلب (مثل `api/app/sessions/...`) |
| `http_method` | `GET` / `POST` / … |
| `response_status` | رمز HTTP |
| `actor` | `{ type, type_label?, id, name, phone }` |
| `action?` | `{ key, label }` — عنوان العملية للعرض |
| `request_details?` | `{ endpoint, method, status_code, performed_at }` |
| `actor_details?` | `{ type, name, phone?, id }` — نسخة موجّهة للعرض |
| `changes_count?` | عدد عناصر التغيير |
| `changes` | مصفوفة تغييرات (انظر الجدول التالي) |

**عنصر `StudentAuditLogChange`:** بالإضافة إلى `field`, `label`, `before`, `after` قد يُرسل الخادم:  
`field_key`, `field_label`, `before_display`, `after_display`, `old_value`, `new_value`, `before_raw`, `after_raw`.

**مثال عنصر داخل `logs[]` (شكل أحدث):**

```json
{
  "id": 12193,
  "action": { "key": "subscription_pause_requested", "label": "طلب إيقاف اشتراك" },
  "created_at": "2026-05-06T21:40:16+03:00",
  "path": "api/app/subscription-pause-requests",
  "http_method": "POST",
  "response_status": 200,
  "changes_count": 2,
  "request_details": {
    "endpoint": "api/app/subscription-pause-requests",
    "method": "POST",
    "status_code": 200,
    "performed_at": "2026-05-06T21:40:16+03:00"
  },
  "actor": {
    "type": "dashboard_user",
    "type_label": "مستخدم لوحة التحكم",
    "id": 110,
    "name": "منه عمرو وفقي",
    "phone": "01289271569"
  },
  "actor_details": {
    "type": "مستخدم لوحة التحكم",
    "name": "منه عمرو وفقي",
    "phone": "01289271569",
    "id": 110
  },
  "changes": [
    {
      "field": "sessions",
      "label": "الحصص",
      "before": "12",
      "after": "3",
      "field_key": "sessions",
      "field_label": "الحصص",
      "before_display": "12",
      "after_display": "3",
      "before_raw": { "count": 12 },
      "after_raw": { "count": 3 }
    }
  ]
}
```

### 3.2 صفحة الواجهة (`app/admin/students/[id]/audit-logs/page.tsx`)

- مسار Next.js: **`/admin/students/[id]/audit-logs`**
- **التحميل:** `getStudentAuditLogs(studentId, { page, per_page: 15 })` مع حالة صفحة؛ عند وجود `pagination.total_pages > 1` تظهر أزرار **السابق / التالي**.
- **التصميم:** بطاقة لكل سجل مع شريط تدرّج لوني، عنوان من **`action.label`**، شارة **`changes_count`**، ترجمة مبسّطة لنوع طلب HTTP ولنتيجة الرمز (مثل «اكتمل بنجاح»)، ونصوص توضيحية عربية لمفاتيح **`action.key`** الشائعة (خريطة `ACTION_USER_HINTS`؛ مفاتيح `endpoint_*` تُطبَّع باستبدال `-` بـ `_` للمطابقة).
- **الأقسام:** «تفاصيل الطلب في النظام» (`request_details` مع الرجوع إلى `path` / الحقول العلوية)، «من نفّذ العملية؟» (يُفضَّل **`actor_details`** ثم **`actor`**)، «ما الذي تغيّر؟» يعرض **`before_display` / `after_display`** (مع سلسلة احتياط للقيم الخام)، وتفاصيل تقنية اختيارية لكل حقل، و`<details>` لـ JSON الكامل.
- **جوال:** بطاقات للتغييرات؛ **شاشات أوسع:** صفوف مقارنة قبل/بعد لكل حقل.
- **حقول إضافية من الخادم:** تُستثنى من كتلة «إضافية» المفاتيح المعروفة بما فيها `action`, `request_details`, `actor_details`, `changes_count`.

**إصلاح وقت التشغيل (`toLocaleString`):** لا يجوز دمج **`weekday`** مع **`dateStyle`** / **`timeStyle`** في نفس كائن خيارات `Intl` (يُرمى `TypeError: Invalid option` في بعض البيئات). العرض الحالي يستخدم حقولًا تفصيلية فقط: `weekday`, `year`, `month`, `day`, `hour`, `minute`.

### 3.3 رابط من قائمة الطلاب (`app/admin/students/page.tsx`)

- أيقونة **History** (سجل العمليات) → `Link` إلى  
  **`/admin/students/{student.id}/audit-logs`**  
  في عرض الجوال وعرض الجدول.

---

## 4. تخطيط لوحة التحكم — عرض متجاوب (`app/admin/layout.tsx`)

**الهدف:** تقليل التمرير الأفقي على الشاشات الضيقة.

| التعديل (كلاسات تقريبية) | الغرض |
|---------------------------|--------|
| على الحاوية الخارجية | `min-w-0 overflow-x-hidden` |
| عمود المحتوى الرئيسي | `min-w-0 max-w-full` |
| `<main>` | `min-w-0 max-w-full`، وهامش `p-3 sm:p-4 lg:p-8` |

---

## 5. آلية `apiRequest` ذات الصلة

- الطلبات التي تبدأ بـ `/api/...` تُحوَّل إلى **`/api/dashboard/...`** على `API_BASE_URL`.
- استجابات JSON التي تحتوي **`data`** تُعاد إلى المتصل كقيمة **`data`** فقط (انظر `lib/api-client.ts`).

---

## 6. قائمة مراجعة سريعة للملفات

| الملف |
|--------|
| `app/admin/complaints/page.tsx` |
| `lib/api/session-evaluations.ts` |
| `app/admin/schedule-change-requests/page.tsx` |
| `lib/api/students.ts` (أنواع + `getStudentAuditLogs`) |
| `app/admin/students/[id]/audit-logs/page.tsx` |
| `app/admin/students/page.tsx` |
| `app/admin/layout.tsx` |

---

*آخر تحديث: مُولَّد لملخص المحادثة؛ راجع الكود الفعلي عند اختلاف إصدار الـ API.*
