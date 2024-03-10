import { useState, FormEvent } from 'react';
import { Pinecone } from '@pinecone-database/pinecone';
import Image from 'next/image';
import { ClipLoader } from 'react-spinners'; // Step 1: Import ClipLoader

const Home: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Array<{ Title: string; URL: string, Contract:string, Creator:string,}>>([]);
  const [loading, setLoading] = useState<boolean>(false); // Step 2: Add a loading state
  const pc = new Pinecone({
    apiKey: process.env.NEXT_PUBLIC_API_KEY ?? "KEY",
  });
  const index = pc.index(process.env.NEXT_PUBLIC_INDEX ?? "INDEX");

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); // Step 3: Toggle loading to true at the start of the search
    try {
      const { pipeline } = await import("@xenova/transformers");
      const extractor = await pipeline("embeddings", "Xenova/all-MiniLM-L6-v2");
      const embeddedQuery = await extractor(query, {pooling: 'mean', normalize: true });
      const data: number[] = Array.from(embeddedQuery.data);
      const results = await index.query({
        vector: data,
        topK: 5,
        includeMetadata: true,
        includeValues: false,
      });
      setResults(results.matches.map((result: any) => ({
        Title: result.metadata.tag,
        URL: result.metadata.url,
        Contract: result.metadata.contractaddress,
        Creator: result.metadata.creatoraddress

      })));
    } catch (error) {
      console.error('Search request failed', error);
    } finally {
      setLoading(false); // Toggle loading to false when the search is done
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-center">
        <h1 className="text-3xl font-bold text-center text-gray-800">Smoogle.eth</h1>
        <Image src="smoogle.eth.svg" width={50} height={50} alt="logo"/> 
      </div>
      <h4 className="text-2xl mt-4 text-center text-gray-500">A Semantic Smart Contract Search Engine on Ethereum</h4>
      <form onSubmit={handleSearch} className="mt-4 flex flex-col items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query"
          required
          className="form-input mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <button type="submit" className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow focus:outline-none transition duration-150 ease-in-out">
          Search
        </button>
      </form>
      {loading && ( 
        <ClipLoader className="flex justify-center items-center ml-64" color="#007bff" size={350} />
      )}
      {!loading && results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mt-6 mb-4">Results</h2>
          <ul className="list-none space-y-3 p-2">
            {results.map((result, index) => (
              <li key={index} className="bg-white shadow overflow-hidden rounded-md px-6 py-4">
                <a href={result.URL} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 hover:underline">
                  {result.Title}
                </a>
                <p className='text-green-700 text-sm'>Contract Address: {result.Contract}</p>
                <p className='text-green-700 text-sm'>Creator Address: {result.Creator}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Home;
