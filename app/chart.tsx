"use client";

import React from 'react';
import { Group } from '@visx/group';
import { curveBasis } from '@visx/curve';
import { LinePath } from '@visx/shape';
import { Threshold } from '@visx/threshold';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { withTooltip, Tooltip, defaultStyles as defaultTooltipStyles } from '@visx/tooltip';
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import { timeStamp } from 'console';

export const background = '#f3f3f3';

type Future = {
  instrument: string,
  insertedAt: number,
  lastTrade: {
    price: number,
  }
}
type FutureWithPerpetualPrice = Future & {
  perpetual?: number,
}

// accessors
const getDate = (d: FutureWithPerpetualPrice) => new Date(d.insertedAt);
const getFuturePrice = (d: FutureWithPerpetualPrice) => Number(d.lastTrade.price);
const getPerpetualPrice = (d: FutureWithPerpetualPrice) => Number(d.perpetual);


const defaultMargin = { top: 40, right: 30, bottom: 50, left: 50 };

export type ThresholdProps = {
  width: number;
  height: number;
  data: Array<Future>;
  margin?: { top: number; right: number; bottom: number; left: number };
};

export default function Chart({ data }: { data: unknown[] }) {
  return (
    <ParentSize>
      {({ width, height }) => <Theshold data={data} height={height} width={width} />}
    </ParentSize>
  )
}

const Theshold = withTooltip<ThresholdProps, FutureWithPerpetualPrice>(({ data, width, height, margin = defaultMargin,
  tooltipOpen,
  tooltipLeft,
  tooltipTop,
  tooltipData,
  showTooltip,
  hideTooltip,
}: ThresholdProps & WithTooltipProvidedProps<FutureWithPerpetualPrice>) => {
  if (width < 10) return null;
  const decemberFutures: FutureWithPerpetualPrice[] = data.filter(f => f.instrument === 'BTC-27DEC24');
  const perpetual = data.filter(f => f.instrument === 'BTC-PERPETUAL');
  for (let i = 0; i < perpetual.length; i++) {
    decemberFutures[i].perpetual = perpetual[i].lastTrade.price;
  }
  console.log({ decemberFutures })

  // bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // scales
  const timeScale = scaleTime<number>({
    domain: [
      decemberFutures[0].insertedAt,
      decemberFutures[decemberFutures.length - 1].insertedAt,
    ],
  });
  const temperatureScale = scaleLinear<number>({
    domain: [
      Math.min(...decemberFutures.map((d) => Math.min(getFuturePrice(d), getPerpetualPrice(d)))),
      Math.max(...decemberFutures.map((d) => Math.max(getFuturePrice(d), getPerpetualPrice(d)))),
    ],
    nice: true,
  });

  timeScale.range([0, xMax]);
  temperatureScale.range([yMax, 0]);

  return (
    <svg width={width} height={height}>
      <rect x={0} y={0} width={width} height={height} fill={background} rx={14} />
      <Group left={margin.left} top={margin.top}>
        <GridRows scale={temperatureScale} width={xMax} height={yMax} stroke="#e0e0e0" />
        <GridColumns scale={timeScale} width={xMax} height={yMax} stroke="#e0e0e0" />
        <line x1={xMax} x2={xMax} y1={0} y2={yMax} stroke="#e0e0e0" />
        <AxisBottom top={yMax} scale={timeScale} numTicks={width > 520 ? 10 : 5} />
        <AxisLeft scale={temperatureScale} />
        <text x="-70" y="15" transform="rotate(-90)" fontSize={10}>
          Price (BTC/USD)
        </text>
        <Threshold<FutureWithPerpetualPrice>
          id={`${Math.random()}`}
          data={decemberFutures}
          x={(d) => timeScale(getDate(d)) ?? 0}
          y0={(d) => temperatureScale(getFuturePrice(d)) ?? 0}
          y1={(d) => temperatureScale(getPerpetualPrice(d)) ?? 0}
          clipAboveTo={0}
          clipBelowTo={yMax}
          curve={curveBasis}
          belowAreaProps={{
            fill: 'violet',
            fillOpacity: 0.4,
          }}
          aboveAreaProps={{
            fill: 'green',
            fillOpacity: 0.4,
            onMouseOver: (d) => {
              showTooltip({
                tooltipTop: temperatureScale(getFuturePrice(d)) ?? 0 + 40,
                tooltipLeft: timeScale(getDate(d))! + 40 + 5,
                tooltipData: {
                  min: 'MIN',
                  name: 'NAME',
                },
              });
            },
            onMouseLeave: () => {
              hideTooltip();
            },
          }}
        />
        <LinePath
          data={decemberFutures}
          curve={curveBasis}
          x={(d) => timeScale(getDate(d)) ?? 0}
          y={(d) => temperatureScale(getPerpetualPrice(d)) ?? 0}
          stroke="#222"
          strokeWidth={1.5}
          strokeOpacity={0.8}
          strokeDasharray="1,2"
        />
        <LinePath
          data={decemberFutures}
          curve={curveBasis}
          x={(d) => timeScale(getDate(d)) ?? 0}
          y={(d) => temperatureScale(getFuturePrice(d)) ?? 0}
          stroke="#222"
          strokeWidth={1.5}
        />

        {tooltipOpen && tooltipData && (
          <Tooltip
            top={tooltipTop}
            left={tooltipLeft}
            style={{ ...defaultTooltipStyles, backgroundColor: '#283238', color: 'white' }}
          >
            <div>
              <strong>{tooltipData.name}</strong>
            </div>
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              {tooltipData.max && <div>max: {tooltipData.max}</div>}
              {tooltipData.thirdQuartile && <div>third quartile: {tooltipData.thirdQuartile}</div>}
              {tooltipData.median && <div>median: {tooltipData.median}</div>}
              {tooltipData.firstQuartile && <div>first quartile: {tooltipData.firstQuartile}</div>}
              {tooltipData.min && <div>min: {tooltipData.min}</div>}
            </div>
          </Tooltip>
        )}
      </Group>
    </svg>
  );
})
