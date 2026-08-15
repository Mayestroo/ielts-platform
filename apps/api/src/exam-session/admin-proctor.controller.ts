import { Controller, Get, Post, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { ProctoringAuthorityService } from '../proctoring/proctoring-authority.service.js';

@Controller('api/admin')
export class AdminProctorController {
  constructor(private readonly proctoring: ProctoringAuthorityService) {}

  @Get('live-sessions')
  async getLiveSessions() {
    return this.proctoring.getLiveCandidates();
  }

  @Post('sessions/:id/add-time')
  @HttpCode(HttpStatus.OK)
  async addTime(
    @Param('id') id: string,
    @Body() body: { added_seconds: number }
  ) {
    const addedSeconds = body.added_seconds || 300;
    return this.proctoring.extendTime(id, addedSeconds);
  }

  @Post('sessions/:id/force-submit')
  @HttpCode(HttpStatus.OK)
  async forceSubmit(
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    const reason = body.reason || 'Terminated by Exam Supervisor';
    await this.proctoring.forceSubmit(id, reason);
    return { success: true };
  }
}
