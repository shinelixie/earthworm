import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { insertCourse, insertCoursePack, insertStatement } from "../../../test/fixture/db";
import { cleanDB, signin } from "../../../test/helper/utils";
import { AppModule } from "../../app/app.module";
import { appGlobalMiddleware } from "../../app/useGlobal";
import { endDB } from "../../common/db";
import { DB, DbType } from "../../global/providers/db.provider";

describe("review e2e", () => {
  let app: INestApplication;
  let db: DbType;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appGlobalMiddleware(app);
    db = moduleFixture.get<DbType>(DB);
    await app.init();
    token = await signin(moduleFixture);
  });

  afterEach(async () => {
    await cleanDB(db);
  });

  afterAll(async () => {
    await endDB();
    await app.close();
  });

  async function seedCourse() {
    const pack = await insertCoursePack(db);
    const course = await insertCourse(db, pack.id);
    await insertStatement(db, course.id, 1, { english: "hello world", chinese: "你好世界" });
    await insertStatement(db, course.id, 2, { english: "good morning", chinese: "早上好" });
    return { pack, course };
  }

  it("enqueue creates cards and summary counts them as due", async () => {
    const { pack, course } = await seedCourse();

    await request(app.getHttpServer())
      .post(`/review/${pack.id}/enqueue`)
      .send({ courseId: course.id })
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.added).toBe(2);
      });

    await request(app.getHttpServer())
      .get(`/review/${pack.id}/summary`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.total).toBe(2);
        expect(body.due).toBe(2);
        expect(body.graduated).toBe(0);
      });

    await request(app.getHttpServer())
      .get(`/review/${pack.id}/cards`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.length).toBe(2);
        expect(body[0].english).toBeTruthy();
      });
  });

  it("enqueue is idempotent per statement", async () => {
    const { pack, course } = await seedCourse();

    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post(`/review/${pack.id}/enqueue`)
        .send({ courseId: course.id })
        .set("Authorization", `Bearer ${token}`)
        .expect(201);
    }

    await request(app.getHttpServer())
      .get(`/review/${pack.id}/summary`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.total).toBe(2);
      });
  });

  it("grading good schedules the card into the future", async () => {
    const { pack, course } = await seedCourse();

    await request(app.getHttpServer())
      .post(`/review/${pack.id}/enqueue`)
      .send({ courseId: course.id })
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const cardsResponse = await request(app.getHttpServer())
      .get(`/review/${pack.id}/cards`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const cardId = cardsResponse.body[0].id;

    await request(app.getHttpServer())
      .post(`/review/cards/${cardId}/grade`)
      .send({ grade: "good" })
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.reps).toBe(1);
        expect(body.intervalDays).toBe(1);
        expect(body.graduated).toBe(false);
        expect(new Date(body.dueAt).getTime()).toBeGreaterThan(Date.now());
      });

    await request(app.getHttpServer())
      .get(`/review/${pack.id}/summary`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.due).toBe(1);
      });
  });

  it("grading again keeps the card due immediately and counts a lapse", async () => {
    const { pack, course } = await seedCourse();

    await request(app.getHttpServer())
      .post(`/review/${pack.id}/enqueue`)
      .send({ courseId: course.id })
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    const cardsResponse = await request(app.getHttpServer())
      .get(`/review/${pack.id}/cards`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const cardId = cardsResponse.body[0].id;

    await request(app.getHttpServer())
      .post(`/review/cards/${cardId}/grade`)
      .send({ grade: "again" })
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.lapses).toBe(1);
        expect(body.intervalDays).toBe(0);
      });

    await request(app.getHttpServer())
      .get(`/review/${pack.id}/summary`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.due).toBe(2);
      });
  });

  it("returns 404 when grading someone else's card", async () => {
    await request(app.getHttpServer())
      .post(`/review/cards/not-a-card/grade`)
      .send({ grade: "good" })
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });
});
