const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();

const SEED_PREFIX = "seed_";

const SPECIALTIES = [
    "General Medicine",
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Gastroenterology",
    "Neurology",
    "Obstetrics & Gynecology",
    "Oncology",
    "Ophthalmology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Pulmonology",
    "Radiology",
    "Urology",
    "Other",
];

const PATIENT_COUNT = 16;
const COMPLETED_APPOINTMENT_COUNT = 20;
const SCHEDULED_APPOINTMENT_COUNT = 8;
const REVIEW_COUNT = 14;
const HIDDEN_REVIEW_COUNT = 2;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
    return list[randomInt(0, list.length - 1)];
}

function shuffle(list) {
    return [...list].sort(() => Math.random() - 0.5);
}

function randomRating() {
    const r = Math.random();
    if (r < 0.55) return 5;
    if (r < 0.78) return 4;
    if (r < 0.9) return 3;
    if (r < 0.96) return 2;
    return 1;
}

async function clearSeedData() {
    const seedUsers = await prisma.user.findMany({
        where: { clerkUserId: { startsWith: SEED_PREFIX } },
        select: { id: true },
    });
    const seedUserIds = seedUsers.map((user) => user.id);

    if (seedUserIds.length === 0) return;

    await prisma.appointment.deleteMany({
        where: {
            OR: [
                { patientId: { in: seedUserIds } },
                { doctorId: { in: seedUserIds } },
            ],
        },
    });

    await prisma.user.deleteMany({
        where: { id: { in: seedUserIds } },
    });
}

async function createDoctors() {
    const doctors = [];

    for (let i = 0; i < SPECIALTIES.length; i++) {
        const specialty = SPECIALTIES[i];
        const name = faker.person.fullName();

        const doctor = await prisma.user.create({
            data: {
                clerkUserId: `${SEED_PREFIX}doctor_${i}`,
                email: `seed.doctor.${i}@medimeet-seed.test`,
                name: `Dr. ${name}`,
                role: "DOCTOR",
                specialty,
                experience: randomInt(2, 30),
                credentialUrl: faker.internet.url(),
                description: faker.lorem.paragraph(),
                verificationStatus: "VERIFIED",
            },
        });

        doctors.push(doctor);
    }

    return doctors;
}

async function createPatients() {
    const patients = [];

    for (let i = 0; i < PATIENT_COUNT; i++) {
        const name = faker.person.fullName();
        const credits = randomInt(0, 20);

        const patient = await prisma.user.create({
            data: {
                clerkUserId: `${SEED_PREFIX}patient_${i}`,
                email: `seed.patient.${i}@medimeet-seed.test`,
                name,
                role: "PATIENT",
                credits,
            },
        });

        await prisma.creditTransaction.create({
            data: {
                userId: patient.id,
                amount: credits,
                type: "CREDIT_PURCHASE",
                packageId: "free_user",
            },
        });

        patients.push(patient);
    }

    return patients;
}

async function createUpcomingAvailability(doctors) {
    for (const doctor of doctors) {
        const start = new Date();
        start.setDate(start.getDate() + randomInt(1, 7));
        start.setHours(randomInt(9, 15), 0, 0, 0);
        const end = new Date(start.getTime() + 30 * 60000);

        await prisma.availability.create({
            data: {
                doctorId: doctor.id,
                startTime: start,
                endTime: end,
                status: "AVAILABLE",
            },
        });
    }
}

async function createCompletedAppointments(doctors, patients) {
    const appointments = [];

    for (let i = 0; i < COMPLETED_APPOINTMENT_COUNT; i++) {
        const doctor = pick(doctors);
        const patient = pick(patients);

        const start = new Date();
        start.setDate(start.getDate() - randomInt(1, 60));
        start.setHours(randomInt(9, 16), 0, 0, 0);
        const end = new Date(start.getTime() + 30 * 60000);

        const appointment = await prisma.appointment.create({
            data: {
                patientId: patient.id,
                doctorId: doctor.id,
                startTime: start,
                endTime: end,
                status: "COMPLETED",
                patientDescription: faker.lorem.sentence(),
                notes: Math.random() < 0.6 ? faker.lorem.sentence() : null,
            },
        });

        appointments.push(appointment);
    }

    return appointments;
}

async function createScheduledAppointments(doctors, patients) {
    for (let i = 0; i < SCHEDULED_APPOINTMENT_COUNT; i++) {
        const doctor = pick(doctors);
        const patient = pick(patients);

        const start = new Date();
        start.setDate(start.getDate() + randomInt(1, 14));
        start.setHours(randomInt(9, 16), 0, 0, 0);
        const end = new Date(start.getTime() + 30 * 60000);

        await prisma.availability.create({
            data: {
                doctorId: doctor.id,
                startTime: start,
                endTime: end,
                status: "BOOKED",
            },
        });

        await prisma.appointment.create({
            data: {
                patientId: patient.id,
                doctorId: doctor.id,
                startTime: start,
                endTime: end,
                status: "SCHEDULED",
                patientDescription: faker.lorem.sentence(),
            },
        });
    }
}

async function createReviews(completedAppointments) {
    const reviewedCount = Math.min(REVIEW_COUNT, completedAppointments.length);
    const candidates = shuffle(completedAppointments).slice(0, reviewedCount);

    for (let i = 0; i < candidates.length; i++) {
        const appointment = candidates[i];

        await prisma.review.create({
            data: {
                appointmentId: appointment.id,
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
                rating: randomRating(),
                comment: Math.random() < 0.8 ? faker.lorem.sentence() : null,
                isHidden: i < HIDDEN_REVIEW_COUNT,
            },
        });
    }

    return reviewedCount;
}

async function main() {
    console.log("Clearing previously seeded data...");
    await clearSeedData();

    console.log("Creating doctors...");
    const doctors = await createDoctors();

    console.log("Creating patients...");
    const patients = await createPatients();

    console.log("Creating upcoming availability...");
    await createUpcomingAvailability(doctors);

    console.log("Creating completed appointments...");
    const completedAppointments = await createCompletedAppointments(doctors, patients);

    console.log("Creating scheduled appointments...");
    await createScheduledAppointments(doctors, patients);

    console.log("Creating reviews...");
    const reviewCount = await createReviews(completedAppointments);

    const totalRows =
        doctors.length +
        patients.length +
        doctors.length + // upcoming availability
        SCHEDULED_APPOINTMENT_COUNT + // booked availability
        COMPLETED_APPOINTMENT_COUNT +
        SCHEDULED_APPOINTMENT_COUNT +
        reviewCount +
        patients.length; // credit transactions

    console.log("\nSeed complete:");
    console.log(`  Doctors: ${doctors.length} (across ${SPECIALTIES.length} specialties)`);
    console.log(`  Patients: ${patients.length}`);
    console.log(`  Appointments: ${COMPLETED_APPOINTMENT_COUNT + SCHEDULED_APPOINTMENT_COUNT}`);
    console.log(`  Reviews: ${reviewCount} (${HIDDEN_REVIEW_COUNT} hidden)`);
    console.log(`  ~Total rows created: ${totalRows}`);
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
