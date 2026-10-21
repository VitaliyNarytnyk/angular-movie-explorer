export interface MovieCastMember {
  credit_id: string;
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface MovieCrewMember {
  id: number;
  name: string;
  job: string;
}

export interface MovieCredits {
  cast: MovieCastMember[];
  crew: MovieCrewMember[];
}
