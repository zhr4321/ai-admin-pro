import request from '@/api/request'
import type { VisualizationData, VisualizationParams } from '@/types/visualization'

export function getVisualizationData(params: VisualizationParams) {
  return request.get<VisualizationData>('/visualization/data', { params })
}
