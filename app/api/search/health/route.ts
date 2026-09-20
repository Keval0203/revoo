import { NextRequest } from 'next/server';
import { Client } from '@elastic/elasticsearch';

export async function GET(request: NextRequest) {
  try {
    const client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    });

    // Test connection with a short timeout
    const health = await client.cluster.health({
      request_timeout: 3000,
    });
    
    return Response.json({
      success: true,
      message: 'Elasticsearch connection successful',
      cluster: {
        status: health.status,
        cluster_name: health.cluster_name,
        number_of_nodes: health.number_of_nodes
      }
    });

  } catch (error) {
    console.error('Elasticsearch connection error:', error);
    // Return 200 with failure info - this is a diagnostic endpoint, not a service health check
    return Response.json(
      { 
        success: false,
        error: 'Failed to connect to Elasticsearch', 
        details: error instanceof Error ? error.message : 'Unknown error',
        elasticsearch_url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        note: 'Elasticsearch is optional; demo/fallback data is used when unavailable'
      },
      { status: 200 }
    );
  }
}
