export interface Tag {
  id: number
  name: string
  count?: number
  last_attached?: string
}

export interface MediaItem {
  id: number
  filepath: string
  filename: string
  type: 'image' | 'video' | 'directory'
  size: number
  created_at: string
  tags: Tag[]
}
