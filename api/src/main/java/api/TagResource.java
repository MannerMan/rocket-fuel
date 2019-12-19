package api;

import rx.Observable;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import java.util.List;

@Path("api")
public interface TagResource {
    @GET
    @Path("tags")
    Observable<List<String>> getTags(@QueryParam("search") String searchQuery);

    @GET
    @Path("tags/popular")
    Observable<List<String>> getPopularTags();
}
