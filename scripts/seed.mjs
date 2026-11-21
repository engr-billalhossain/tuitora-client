/**
 * Seeds realistic, connected demo data:
 *   tutors + students (user docs) -> approved tuitions (courses) ->
 *   applications (bookings) -> reviews/testimonials.
 *
 * Every write is an upsert on a stable key, so the script is safe to re-run.
 * Usage:  npm run seed
 */

import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

// Minimal .env loader (no extra dependency required).
const env = {};
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
  }
} catch {
  /* .env is optional when environment variables are already exported */
}

const uri = process.env.MONGODB_URI || env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

const client = new MongoClient(uri);
const db = client.db("tuitoradb");

// Realistic connected demo data lives in a JSON fixture.
const dataset = JSON.parse(
  readFileSync(new URL("./seed-data.json", import.meta.url), "utf8")
);
const { tutors, students, seed, comments, applicationStatuses } = dataset;

function numeric(value) {
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

try {
  await client.connect();

  // 1. Identities that own the tuitions and the applications.
  const userCollection = db.collection("user");
  let users = 0;
  for (const [index, tutor] of tutors.entries()) {
    const result = await userCollection.updateOne(
      { email: tutor.email },
      {
        $set: {
          name: tutor.name,
          role: "tutor",
          plan: "free",
          image: "",
          bio: "Experienced tutor sharing practical, exam-focused lessons.",
        },
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      { upsert: true }
    );
    if (result.upsertedCount) users += 1;
    tutor.id = `seed-tutor-${index}`;
  }
  for (const student of students) {
    const result = await userCollection.updateOne(
      { email: student.email },
      {
        $set: { name: student.name, role: "student", plan: "free", image: "" },
        $setOnInsert: { createdAt: new Date().toISOString() },
      },
      { upsert: true }
    );
    if (result.upsertedCount) users += 1;
    student.id = `seed-student-${students.indexOf(student)}`;
  }

  // 2. Tuitions linked to tutors, with numeric fields for server-side filters.
  const collection = db.collection("courses");
  let inserted = 0;
  let updated = 0;
  const seededIds = [];

  for (const [index, row] of seed.entries()) {
    const [title, subject, classLevel, mode, fee, days, slots, location, tutorIndex, description] = row;
    const tutor = tutors[tutorIndex];
    const createdAt = new Date(Date.now() - (seed.length - index) * 86400000).toISOString();

    const result = await collection.updateOne(
      { title },
      {
        $set: {
          title,
          subject,
          classLevel,
          mode,
          fee,
          monthlyFee: fee,
          feeValue: numeric(fee),
          days,
          daysPerWeek: days,
          daysValue: numeric(days),
          description,
          slots,
          bannerName: "",
          bannerUrl: "",
          bannerImage: "",
          status: "approved",
          approvalStatus: "approved",
          isActive: true,
          location,
          tutorId: tutor.id,
          tutorName: tutor.name,
          tutorEmail: tutor.email,
          tutorImage: tutor.image,
          rating: 4.5 + (index % 5) / 10,
          reviews: 8 + index * 3,
          createdAt,
          reviewedAt: createdAt,
          reviewedBy: "seed-admin",
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) inserted += 1;
    else updated += 1;

    const saved = await collection.findOne({ title });
    if (saved) seededIds.push(String(saved._id));
  }

  // 3. Applications that connect students to tuitions and tutors. A spread of
  //    statuses feeds dashboards and the accepted-student review flow.
  const bookingCollection = db.collection("bookings");
  const statuses = applicationStatuses;
  let applications = 0;
  for (let index = 0; index < seed.length; index += 1) {
    const [title, subject, fee, , slots, , tutorIndex] = seed[index];
    const student = students[index % students.length];
    const tutor = tutors[tutorIndex];
    const status = statuses[index % statuses.length];
    const result = await bookingCollection.updateOne(
      { tuitionId: seededIds[index], studentEmail: student.email, slotId: slots[0] },
      {
        $set: {
          tuitionId: seededIds[index],
          tuitionTitle: title,
          subject,
          monthlyFee: fee,
          slotId: slots[0],
          slotLabel: "Morning Batch",
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          studentPhone: "+1 555 0100",
          tutorId: tutor.id,
          tutorEmail: tutor.email,
          status,
          applicationStatus: status,
          appliedAt: new Date(Date.now() - index * 86400000).toISOString(),
          createdAt: new Date(Date.now() - index * 86400000).toISOString(),
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) applications += 1;
  }

  // 4. Connected testimonials for the home page and review system.
  const reviewCollection = db.collection("reviews");
  let reviews = 0;
  for (let index = 0; index < comments.length; index += 1) {
    const seedIndex = index % seed.length;
    const row = seed[seedIndex];
    const tutor = tutors[row[9]];
    const student = students[seedIndex % students.length];
    const result = await reviewCollection.updateOne(
      { tuitionId: seededIds[seedIndex] || `seed-${seedIndex}`, studentEmail: student.email },
      {
        $set: {
          tuitionId: seededIds[seedIndex] || `seed-${seedIndex}`,
          tutorId: tutor.id,
          tutorName: tutor.name,
          tutorImage: tutor.image,
          subject: row[1],
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          rating: 5 - (index % 2),
          comment: comments[index],
          createdAt: new Date(Date.now() - index * 86400000).toISOString(),
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) reviews += 1;
  }

  console.log(
    `Seed complete: ${users} users, ${inserted} inserted + ${updated} updated tuitions, ${applications} applications, ${reviews} reviews.`
  );
} finally {
  await client.close();
}
