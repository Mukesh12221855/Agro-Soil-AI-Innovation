import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-sm">
      <p className="text-dark-300 text-xs">{label}</p>
      <p className="text-primary-300 font-semibold">₹{payload[0].value?.toLocaleString('en-IN')}</p>
    </div>
  )
}

export default function MarketChart({ data = [], title = 'Price Trend' }) {
  if (!data.length) {
    return (
      <div className="glass-card p-6 text-center text-dark-400">
        <p>No market data available</p>
      </div>
    )
  }

  const chartData = [...data].reverse().map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    price: d.avg_price || d.price_modal || 0,
  }))

  return (
    <div className="glass-card p-5">
      <h3 className="font-display font-semibold text-base text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#7f8583', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#7f8583', fontSize: 11 }}
            tickFormatter={(v) => `₹${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#1D9E75"
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#1D9E75', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
