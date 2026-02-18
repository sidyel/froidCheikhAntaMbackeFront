import { TestBed } from '@angular/core/testing';

import { ImageLoadingService } from './image-loading.service';

describe('ImageLoadingService', () => {
  let service: ImageLoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageLoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
