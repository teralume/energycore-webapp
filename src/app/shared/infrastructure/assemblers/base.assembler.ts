export abstract class BaseAssembler<TEntity, TResource, TResponse> {
  abstract toEntity(response: TResponse): TEntity;

  abstract toResource(entity: TEntity): TResource;
}