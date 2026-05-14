export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FlightRecord = {
  id: string;
  user_id: string;
  flown_at: string;
  flight_number: string | null;
  from_airport: string;
  to_airport: string;
  cabin: "economy" | "first";
  fare_type: string | null;
  pp: number;
  aircraft: string | null;
  seat: string | null;
  lounge: string | null;
  rating_seat: number | null;
  rating_aircraft: number | null;
  rating_lounge: number | null;
  notes: string | null;
  created_at: string;
};

export type FlightInsert = {
  id?: string;
  user_id: string;
  flown_at: string;
  flight_number?: string | null;
  from_airport: string;
  to_airport: string;
  cabin: "economy" | "first";
  fare_type?: string | null;
  pp: number;
  aircraft?: string | null;
  seat?: string | null;
  lounge?: string | null;
  rating_seat?: number | null;
  rating_aircraft?: number | null;
  rating_lounge?: number | null;
  notes?: string | null;
  created_at?: string;
};

export type FlightUpdate = Partial<Omit<FlightRecord, "id" | "user_id" | "created_at">>;

export type Database = {
  public: {
    Tables: {
      flights: {
        Row: FlightRecord;
        Insert: FlightInsert;
        Update: FlightUpdate;
        Relationships: [];
      };
    };
    Views: { [k: string]: never };
    Functions: { [k: string]: never };
    Enums: { [k: string]: never };
    CompositeTypes: { [k: string]: never };
  };
};
