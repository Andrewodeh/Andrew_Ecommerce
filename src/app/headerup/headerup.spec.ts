import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Headerup } from './headerup';

describe('Headerup', () => {
  let component: Headerup;
  let fixture: ComponentFixture<Headerup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Headerup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Headerup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
