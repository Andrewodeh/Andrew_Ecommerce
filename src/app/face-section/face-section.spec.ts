import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaceSection } from './face-section';

describe('FaceSection', () => {
  let component: FaceSection;
  let fixture: ComponentFixture<FaceSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaceSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaceSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
