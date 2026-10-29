import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Website } from 'entities/website.entity';
import { mock } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { ScanStatus } from 'entities/scan-status';
import { AnalysisService } from './analysis.service';
import { QueueService } from '@app/queue/queue.service';

describe('AnalysisService', () => {
  let service: AnalysisService;
  let mockRepository: any;
  let mockQB: any;
  let mockQueueService: any;

  beforeEach(async () => {
    mockRepository = mock<Repository<Website>>();
    mockQB = mock<any>();
    mockQueueService = mock<QueueService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        {
          provide: getRepositoryToken(Website),
          useValue: mockRepository,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('filters by scan_status against the primary scan status column', async () => {
    mockQB.innerJoinAndSelect.mockReturnThis();
    mockQB.andWhere.mockReturnThis();
    mockQB.orderBy.mockReturnThis();
    mockQB.getMany.mockResolvedValue([]);
    mockQueueService.getQueueCounts.mockResolvedValue({
      waiting: 0,
      active: 0,
      delayed: 0,
      failed: 0,
    });
    mockRepository.createQueryBuilder.mockReturnValue(mockQB);

    await service.getWebsiteAnalysis({
      scan_status: ScanStatus.Timeout,
    });

    expect(mockQB.andWhere).toHaveBeenCalledWith(
      'coreResult.primaryScanStatus = :status',
      { status: ScanStatus.Timeout },
    );
  });
});
