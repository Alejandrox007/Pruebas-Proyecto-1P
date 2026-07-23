const { z } = require('zod');

const name = z.string().trim().min(2).max(80)
  .regex(/^[\p{L}]+(?:[ '-][\p{L}]+)*$/u, 'Only letters, spaces, apostrophes and hyphens are allowed');
const email = z.string().trim().toLowerCase().email().max(254);
const phone = z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Use 7 to 15 digits, optionally starting with +');
const password = z.string().min(10).max(72)
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');
const idParams = z.object({ id: z.coerce.number().int().positive() });
const emptyQuery = z.object({}).passthrough();
const medicineQuery = z.object({
  search: z.string().trim().max(100).optional()
}).strict();

const register = z.object({
  name,
  lastName: name,
  email,
  password,
  phone,
  gender: z.enum(['Masculino', 'Femenino', 'Otro']),
  birthDate: z.iso.date().optional()
}).strict();

const login = z.object({ email, password: z.string().min(1).max(72) }).strict();

const doctorCreate = z.object({
  name,
  lastName: name,
  specialtyId: z.number().int().positive(),
  phone,
  email,
  licenseNumber: z.string().trim().min(4).max(30).regex(/^[A-Za-z0-9-]+$/),
  initialPassword: password
}).strict();

const doctorUpdate = doctorCreate.omit({ initialPassword: true }).partial().strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

const specialty = z.object({
  name: z.string().trim().min(2).max(80)
    .regex(/^[\p{L}]+(?:[ '-][\p{L}]+)*$/u),
  description: z.string().trim().max(300).nullable().optional()
}).strict();

const medicine = z.object({
  name: z.string().trim().min(2).max(100)
    .regex(/^[\p{L}0-9]+(?:[ .'-][\p{L}0-9]+)*$/u),
  description: z.string().trim().max(500).nullable().optional()
}).strict();

const medicineUpdate = medicine.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required'
);

const patientUpdate = z.object({
  name: name.optional(),
  lastName: name.optional(),
  phone: phone.optional(),
  gender: z.enum(['Masculino', 'Femenino', 'Otro']).optional(),
  birthDate: z.iso.date().nullable().optional(),
  illness: z.string().trim().min(2).max(300).optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');

const appointmentCreate = z.object({
  doctorId: z.number().int().positive(),
  patientId: z.number().int().positive().optional(),
  scheduledAt: z.iso.datetime({ offset: true }),
  reason: z.string().trim().min(5).max(500)
}).strict();

const appointmentUpdate = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled']),
  notes: z.string().trim().max(1000).optional()
}).strict();

const prescriptionCreate = z.object({
  appointmentId: z.number().int().positive(),
  diagnosis: z.string().trim().min(3).max(500),
  instructions: z.string().trim().min(3).max(1000),
  medications: z.array(z.object({
    medicineId: z.number().int().positive(),
    dosage: z.string().trim().min(1).max(120),
    frequency: z.string().trim().min(1).max(120),
    duration: z.string().trim().min(1).max(120)
  }).strict()).min(1).max(20)
}).strict().superRefine((value, context) => {
  const ids = value.medications.map((item) => item.medicineId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: 'custom', path: ['medications'], message: 'Medicines cannot be duplicated' });
  }
});

module.exports = {
  appointmentCreate,
  appointmentUpdate,
  doctorCreate,
  doctorUpdate,
  emptyQuery,
  idParams,
  login,
  medicine,
  medicineQuery,
  medicineUpdate,
  patientUpdate,
  prescriptionCreate,
  register,
  specialty
};
