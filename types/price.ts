interface Fee {
  frequency: "fixed" | "hourly" | "daily";
  price: Price[];
}

interface Price {
  fromTime?: string;
  toTime?: string;
  price: number;
}
