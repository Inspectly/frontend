import { api } from "./apiSlice";

export type TaskStatus =
  | "Status.PENDING"
  | "Status.IN_PROGRESS"
  | "Status.FAILED"
  | "Status.COMPLETED";

export type TaskType =
  | "Task_Type.EXTRACT_ISSUES"
  | "Task_Type.EXTRACT_IMAGES"
  ;

export interface Task {
  id: number;
  report_id: number;
  task_type: TaskType;
  status: TaskStatus;
  created_at: string;  
  updated_at: string; 
}

export const taskApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /tasks/
    getTasks: builder.query<Task[], void>({
      query: () => "tasks/",
    }),
    // GET /tasks/{id}
    getTaskById: builder.query<Task, number | string>({
      query: (id) => `tasks/${id}`,
    }),
    // GET /tasks/report/{report_id}
    getTasksByReportId: builder.query<Task[], number | string>({
      query: (reportId) => `tasks/report/${reportId}`,
    }),
    // POST /tasks/
    createTask: builder.mutation<Task, Partial<Task>>({
      query: (body) => ({
        url: "tasks/",
        method: "POST",
        body,
      }),
    }),
    // PUT /tasks/{id}
    updateTask: builder.mutation<Task, { id: number | string } & Partial<Task>>({
      query: ({ id, ...body }) => ({
        url: `tasks/${id}`,
        method: "PUT",
        body,
      }),
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useGetTasksByReportIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
} = taskApi;

export const { getTaskById, getTasksByReportId } = taskApi.endpoints;
