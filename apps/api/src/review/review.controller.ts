import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../guards/auth.guard";
import { User, UserEntity } from "../user/user.decorators";
import { ReviewGrade, ReviewService } from "./review.service";

@ApiBearerAuth()
@ApiTags("Review")
@Controller("review")
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @ApiOperation({ summary: "把某课程的全部语句加入复习队列" })
  @UseGuards(AuthGuard)
  @Post(":coursePackId/enqueue")
  enqueue(
    @User() user: UserEntity,
    @Param("coursePackId") coursePackId: string,
    @Body() body: { courseId: string },
  ) {
    return this.reviewService.enqueue(user.userId, coursePackId, body.courseId);
  }

  @ApiOperation({ summary: "课程包复习概览（总卡数/到期/已毕业）" })
  @UseGuards(AuthGuard)
  @Get(":coursePackId/summary")
  summary(@User() user: UserEntity, @Param("coursePackId") coursePackId: string) {
    return this.reviewService.summary(user.userId, coursePackId);
  }

  @ApiOperation({ summary: "按课程统计复习卡片" })
  @UseGuards(AuthGuard)
  @Get(":coursePackId/summary-by-course")
  summaryByCourse(@User() user: UserEntity, @Param("coursePackId") coursePackId: string) {
    return this.reviewService.summaryByCourse(user.userId, coursePackId);
  }

  @ApiOperation({ summary: "获取到期复习卡片" })
  @UseGuards(AuthGuard)
  @Get(":coursePackId/cards")
  cards(
    @User() user: UserEntity,
    @Param("coursePackId") coursePackId: string,
    @Query("limit") limit?: string,
  ) {
    const parsed = Number(limit);
    return this.reviewService.dueCards(
      user.userId,
      coursePackId,
      Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 20,
    );
  }

  @ApiOperation({ summary: "提交一次复习评分，返回更新后的卡片" })
  @UseGuards(AuthGuard)
  @Post("cards/:cardId/grade")
  grade(
    @User() user: UserEntity,
    @Param("cardId") cardId: string,
    @Body() body: { grade: ReviewGrade },
  ) {
    return this.reviewService.grade(user.userId, cardId, body.grade);
  }
}
