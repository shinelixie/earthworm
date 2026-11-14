import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { createId } from "@paralleldrive/cuid2";
import * as request from "supertest";

import { cleanDB, signin } from "../../../test/helper/utils";
import { AppModule } from "../../app/app.module";
import { appGlobalMiddleware } from "../../app/useGlobal";
import { endDB } from "../../common/db";
import { DB, DbType } from "../../global/providers/db.provider";

describe("learning-path e2e", () => {
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

  it("get: /learning-path/:coursePackId/config returns default config", async () => {
    const coursePackId = createId();

    await request(app.getHttpServer())
      .get(`/learning-path/${coursePackId}/config`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.modes).toEqual(["chinese_to_english", "dictation", "listening"]);
        expect(body.difficulties).toEqual(["beginner", "intermediate", "advanced"]);
        expect(body.dailyLimitsByMode.chinese_to_english).toBe(10);
      });
  });

  it("post: /learning-path/:coursePackId/complete records stars and consumes quota", async () => {
    const coursePackId = createId();
    const courseId = createId();

    await request(app.getHttpServer())
      .post(`/learning-path/${coursePackId}/complete`)
      .send({
        courseId,
        mode: "chinese_to_english",
        difficulty: "beginner",
        rank: "A",
        statementCount: 5,
      })
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.stars).toBe(3);
        expect(body.remaining).toBe(5);
      });

    await request(app.getHttpServer())
      .get(`/learning-path/${coursePackId}/progress`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        const entry = body.courses[0].modes.chinese_to_english.beginner;
        expect(entry.stars).toBe(3);
        expect(entry.bestRank).toBe("A");
        expect(entry.completed).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/learning-path/${coursePackId}/daily-limits`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.todayCompletedByMode.chinese_to_english).toBe(5);
        expect(body.remainingByMode.chinese_to_english).toBe(5);
      });
  });

  it("post: worse rank never lowers best rank or stars", async () => {
    const coursePackId = createId();
    const courseId = createId();

    await request(app.getHttpServer())
      .post(`/learning-path/${coursePackId}/complete`)
      .send({ courseId, mode: "dictation", difficulty: "advanced", rank: "S", statementCount: 1 })
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/learning-path/${coursePackId}/complete`)
      .send({ courseId, mode: "dictation", difficulty: "advanced", rank: "C", statementCount: 1 })
      .set("Authorization", `Bearer ${token}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.bestRank).toBe("S");
        expect(body.stars).toBe(3);
      });
  });
});
