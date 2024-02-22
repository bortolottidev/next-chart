import Chart from "./chart"
import { MongoClient, ServerApiVersion } from 'mongodb';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGO_URI: string
    }
  }
}

const uri = process.env.MONGO_URI

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function getData() {
  try {
    await client.connect();
    const futures = await client.db("deribit").collection("future").find({}).toArray();
    console.log(futures[0])
    // remove _id
    return futures.map(({ _id, ...others }) => others);
  } finally {
    await client.close();
  }
}

export default async function Home() {
  const data = await getData();
  return (
    <main className="flex min-h-screen flex-col items-stretch justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        Hello charties
      </div>

      <div className="h-[30rem] w-full">
        <Chart data={data} />
      </div>
    </main>
  );
}
