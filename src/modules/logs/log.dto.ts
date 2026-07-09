export interface CreateLogDto {
  taskId: string;
  taskCode?: string;
  action: string;
  detail: string;
}
