import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewArrivalSection } from './new-arrival-section';

describe('NewArrivalSection', () => {
  let component: NewArrivalSection;
  let fixture: ComponentFixture<NewArrivalSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewArrivalSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewArrivalSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
