import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../guards/auth.guard";
import { User, UserEntity } from "../user/user.decorators";
import { CompleteSessionInput, LearningPathService } from "./learning-path.service";

@ApiBearerAuth()
@ApiTags("LearningPath")
@Controller("learning-path")
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @ApiOperation({ summary: "获取课程包的学习路径配置（模式/难度/星级/每日限额）" })
  @UseGuards(AuthGuard)
  @Get(":coursePackId/config")
  getConfig(@Param("coursePackId") coursePackId: string) {
    return this.learningPathService.getConfig(coursePackId);
  }

  @ApiOperation({ summary: "获取用户在课程包内的模式×难度学习进度" })
  @UseGuards(AuthGuard)
  @Get(":coursePackId/progress")
  getProgress(@User() user: UserEntity, @Param("coursePackId") coursePackId: string) {
    return this.learningPathService.getProgress(user.userId, coursePackId);
  }

  @ApiOperation({ summary: "获取今日各模式已完成条数与剩余额度" })
  @UseGuards(AuthGuard)
  @Get(":coursePackId/daily-limits")
  getDailyLimits(@User() user: UserEntity, @Param("coursePackId") coursePackId: string) {
    return this.learningPathService.getDailyLimits(user.userId, coursePackId);
  }

  @ApiOperation({ summary: "提交一次练习结果，写入星级并累计每日额度" })
  @UseGuards(AuthGuard)
  @Post(":coursePackId/complete")
  complete(
    @User() user: UserEntity,
    @Param("coursePackId") coursePackId: string,
    @Body() body: CompleteSessionInput,
  ) {
    return this.learningPathService.completeSession(user.userId, coursePackId, body);
  }
}
