
import DeliveryDetailsClientPage from "./delivery-details-client-page";

export default async function DeliveryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <DeliveryDetailsClientPage id={id} />;
}
