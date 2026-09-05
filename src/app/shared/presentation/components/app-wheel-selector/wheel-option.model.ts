export type WheelOptionValue = string | number;

export interface WheelOption<TValue extends WheelOptionValue = WheelOptionValue> {
  label: string;
  value: TValue;
  sublabel?: string;
}

export interface VisibleWheelOption<TValue extends WheelOptionValue = WheelOptionValue> extends WheelOption<TValue> {
  index: number;
}
