let pendingLiveStream: MediaStream | null = null

export function setPendingLiveStream(stream: MediaStream): void {
  pendingLiveStream?.getTracks().forEach(track => track.stop())
  pendingLiveStream = stream
}

export function takePendingLiveStream(): MediaStream | null {
  const stream = pendingLiveStream
  pendingLiveStream = null
  return stream
}

export function discardPendingLiveStream(): void {
  pendingLiveStream?.getTracks().forEach(track => track.stop())
  pendingLiveStream = null
}
