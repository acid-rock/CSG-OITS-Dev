import { z } from 'zod';

// ─── Shared field definitions ────────────────────────────────────────────────

const uuidField = z.string().uuid({ message: 'Invalid ID format' });

const termYearField = z.string()
  .regex(/^AY \d{4}-\d{4}$/, 'Term year must be in format: AY YYYY-YYYY')
  .optional();

// ─── Announcements (bulletin) ────────────────────────────────────────────────

export const addAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(50000),
  category: z.enum([
    'CSG Updates',
    'Class Advisories',
    'Examinations',
    'University Events',
    'Official CVSU',
  ]).default('CSG Updates'),
  term_year: termYearField,
});

export const editAnnouncementSchema = z.object({
  id: uuidField,
  title: z.string().min(1).max(300).optional(),
  content: z.string().min(1).max(50000).optional(),
  category: z.enum([
    'CSG Updates', 'Class Advisories', 'Examinations',
    'University Events', 'Official CVSU',
  ]).optional(),
  term_year: termYearField,
});

export const deleteIdsSchema = z.object({
  ids: z.array(uuidField).min(1, 'At least one ID required'),
});

export const singleIdSchema = z.object({
  id: uuidField,
});

// ─── Documents ───────────────────────────────────────────────────────────────

export const addDocumentSchema = z.object({
  name: z.string()
    .min(1, 'Document name is required')
    .max(200)
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Name contains invalid characters'),
  type: z.string()
    .min(1, 'Document type is required')
    .max(100)
    .regex(/^[a-zA-Z0-9-]+$/, 'Type must be alphanumeric with hyphens only'),
  description: z.string().max(1000).optional(),
  term_year: termYearField,
});

export const editDocumentSchema = z.object({
  id: uuidField,
  name: z.string()
    .min(1).max(200)
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters')
    .optional(),
  type: z.string()
    .min(1).max(100)
    .regex(/^[a-zA-Z0-9\-]+$/, 'Type must be alphanumeric with hyphens only')
    .optional(),
  description: z.string().max(1000).optional(),
  term_year: termYearField,
});

// ─── Events ──────────────────────────────────────────────────────────────────

export const addEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(300),
  description: z.string().min(1, 'Description is required').max(50000),
  date_happened: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Date must be in YYYY-MM-DD format'),
  term_year: termYearField,
});

export const editEventSchema = z.object({
  id: uuidField,
  name: z.string().min(1).max(300).optional(),
  description: z.string().min(1).max(50000).optional(),
  date_happened: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  term_year: termYearField,
});

// ─── Officers ────────────────────────────────────────────────────────────────

export const addOfficerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200),
  position: z.string().min(1, 'Position is required').max(200),
  // 'member' added — committee members are assigned this type
  type: z.enum(['executive', 'board', 'adviser', 'former', 'member']),
  // committee comes from a FormData <select>; empty string means "no committee"
  committee: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().positive().nullable().optional(),
  ),
  // is_committee_official comes from a checkbox FormData value ("true"/"false")
  is_committee_official: z.preprocess(
    (v) => v === 'true' || v === true || v === '1',
    z.boolean().default(false),
  ),
  socials: z.string().url('Must be a valid URL').optional().nullable()
    .or(z.literal('')),
  year_serving: z.string().max(20).optional(),
  student_number: z.string().max(20).optional(),
  term_year: termYearField,
});

export const editOfficerSchema = addOfficerSchema.partial().extend({
  id: uuidField,
});

export const archiveOfficerSchema = z.object({
  id: uuidField,
  term_year: z.string().min(1, 'Term year is required when archiving an officer'),
});

// ─── Committees ──────────────────────────────────────────────────────────────

export const addCommitteeSchema = z.object({
  name: z.string().min(1, 'Committee name is required').max(200),
});

export const editCommitteeSchema = z.object({
  // committees.id is UUID (gen_random_uuid()) — never parse as integer
  id: uuidField,
  name: z.string().min(1).max(200),
});

export const committeeIdSchema = z.object({
  id: uuidField,
});

export const committeeIdsSchema = z.object({
  ids: z.array(uuidField).min(1),
});

// ─── Organizations ───────────────────────────────────────────────────────────

export const addOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(200),
  description: z.string().max(2000).optional(),
  facebook_link: z.string().url('Must be a valid URL').optional().nullable()
    .or(z.literal('')),
});

export const editOrganizationSchema = z.object({
  id: uuidField,
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  facebook_link: z.string().url().optional().nullable().or(z.literal('')),
});

// ─── Equipment ───────────────────────────────────────────────────────────────

export const addEquipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required').max(200),
  quantity: z.number().int().min(0),
  max_quantity: z.number().int().min(1),
  is_available: z.boolean().default(true),
});

export const borrowRequestSchema = z.object({
  equipment_id: uuidField,
  requester_name: z.string().min(1, 'Name is required').max(200),
  student_number: z.string().min(1, 'Student number is required').max(20),
  student_email: z.string().email('Invalid email address'),
  purpose: z.string().min(1, 'Purpose is required').max(500),
  date_needed: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Date must be in YYYY-MM-DD format'),
});

// ─── User / Auth ──────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Settings ────────────────────────────────────────────────────────────────

export const settingValueSchema = z.object({
  value: z.string().min(1, 'Value is required').max(100),
});
