function handleStreamChunks(stream, onChunkReceived) {
    stream.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
            if (line.trim()) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.success && parsed.response) {
                        onChunkReceived(parsed.response);
                    }
                } catch (error) {
                    console.error('Error parsing chunk:', error.message);
                }
            }
        }
    });

    stream.on('end', () => {
        onChunkReceived(null);
    });
}

module.exports = {handleStreamChunks};