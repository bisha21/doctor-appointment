

const SpecialtyPage = async ({params}) => {
    const {specialty} = await params;
    console.log(specialty);
  return (
    <div>SpecialtyPage</div>
  )
}

export default SpecialtyPage