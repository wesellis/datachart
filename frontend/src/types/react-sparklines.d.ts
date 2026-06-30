declare module 'react-sparklines' {
  import { Component } from 'react';

  export interface SparklinesProps {
    data?: number[];
    limit?: number;
    width?: number;
    height?: number;
    svgWidth?: number;
    svgHeight?: number;
    preserveAspectRatio?: string;
    margin?: number;
    min?: number;
    max?: number;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }

  export class Sparklines extends Component<SparklinesProps> {}

  export interface SparklinesLineProps {
    color?: string;
    style?: React.CSSProperties;
  }

  export class SparklinesLine extends Component<SparklinesLineProps> {}

  export interface SparklinesSpotsProps {
    size?: number;
    style?: React.CSSProperties;
    spotColors?: { [key: string]: string };
  }

  export class SparklinesSpots extends Component<SparklinesSpotsProps> {}

  export interface SparklinesReferenceLineProps {
    type?: 'max' | 'min' | 'mean' | 'avg' | 'median' | 'custom';
    value?: number;
    style?: React.CSSProperties;
  }

  export class SparklinesReferenceLine extends Component<SparklinesReferenceLineProps> {}

  export interface SparklinesBarsProps {
    style?: React.CSSProperties;
    barWidth?: number;
    margin?: number;
  }

  export class SparklinesBars extends Component<SparklinesBarsProps> {}
}