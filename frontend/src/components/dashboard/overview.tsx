import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const data = [
  {
    name: 'Mon',
    pods: Math.floor(Math.random() * 50) + 100,
  },
  {
    name: 'Tue',
    pods: Math.floor(Math.random() * 50) + 100,
  },
  {
    name: 'Wed',
    pods: Math.floor(Math.random() * 50) + 100,
  },
  {
    name: 'Thu',
    pods: Math.floor(Math.random() * 50) + 100,
  },
  {
    name: 'Fri',
    pods: Math.floor(Math.random() * 50) + 100,
  },
  {
    name: 'Sat',
    pods: Math.floor(Math.random() * 50) + 100,
  },
  {
    name: 'Sun',
    pods: Math.floor(Math.random() * 50) + 100,
  },
];

export function Overview() {
  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Bar
          dataKey='pods'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
