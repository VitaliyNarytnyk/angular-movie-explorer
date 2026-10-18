import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovieSearch } from './movie-search';

describe('MovieSearch', () => {
  let component: MovieSearch;
  let fixture: ComponentFixture<MovieSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
