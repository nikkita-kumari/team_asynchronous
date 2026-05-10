import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';

export default function GenericList({ endpoint, title, columns, renderActions, emptyMessage, searchFields, filterKey, filterOptions }: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(endpoint);
      setData(res.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData() }, [endpoint]);

  const filteredData = React.useMemo(() => {
    let result = data;
    
    // Apply filter if selected
    if (filterKey && selectedFilter) {
      result = result.filter(item => String(item[filterKey] || '').toLowerCase() === selectedFilter.toLowerCase());
    }

    // Apply search query
    if (!searchQuery || !searchFields) return result;
    const lowerQ = searchQuery.toLowerCase();
    return result.filter(item => 
      searchFields.some((field: string) => 
        String(item[field] || '').toLowerCase().includes(lowerQ)
      )
    );
  }, [data, searchQuery, searchFields, filterKey, selectedFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          {filterKey && filterOptions && (
            <select 
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-sm text-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">All</option>
              {filterOptions.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          {searchFields && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-900 border border-gray-800 text-sm text-white rounded-lg pl-10 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : data.length === 0 ? (
           <div className="p-12 text-center text-gray-500">{emptyMessage || 'No records found.'}</div>
        ) : filteredData.length === 0 ? (
           <div className="p-12 text-center text-gray-500">No matches found for your search/filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-950 text-gray-400 font-medium">
                <tr>
                  {columns.map((col: any) => <th key={col.key} className="px-6 py-4">{col.label}</th>)}
                  {renderActions && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredData.map((row: any) => (
                  <tr key={row._id} className="hover:bg-gray-800/50 transition-colors">
                    {columns.map((col: any) => (
                      <td key={col.key} className="px-6 py-4">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                    {renderActions && (
                      <td className="px-6 py-4 text-right">
                        {renderActions(row, fetchData)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
